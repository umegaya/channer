package packet

import (
	"log"
	"time"
	"bytes"
	"strconv"
	"crypto/sha256"
	"encoding/base64"
	
	proto "../../proto"
)

var SECRET string = "506779d073f0c20d5e14c62c7261db6bd238be7312ebef394ca1b05226740742";

//Account represents one user account
type Account struct {
	user string
	secret string
	rescue string //when user forget password, we set some random hash here and login command with same value of this, can replace hash with new value
}
var amap map[string]Account = make(map[string]Account)

//Device represents device which each user uses (single user may have multiple devices)
type Device struct {
	id string
	last_access time.Time
	last_from string
}
var dmap map[string]map[string]Device = make(map[string]map[string]Device)

//cals_sha256 is handy methods for calculating sha256 string from string.
func calc_sha256(source string) string {
	shabytes := sha256.Sum256(bytes.NewBufferString(source).Bytes())
	return base64.StdEncoding.EncodeToString(shabytes[:sha256.Size])
}

//compute_sign is calculate signature of login request.
func compute_sign(user, secret string, walltime uint64) string {
	src := strconv.FormatUint(walltime, 10) + user + secret
	log.Printf("src:%v", src)
	return calc_sha256(src)
}

//compute_user_secret calculates secret for users
func compute_user_secret(user, pass string, walltime uint64) string {
	return calc_sha256(strconv.FormatUint(walltime, 10) + user + pass + SECRET)
}

//TODO: entirely use database as datastore
func ProcessLogin(from Source, msgid uint32, req *proto.LoginRequest, t Transport) {
	user := req.User
	walltime := req.Walltime
	version := req.Version
	if user == nil || walltime == nil || version == nil {
		SendError(from, msgid, proto.Error_Login_UserNotFound)
		return	
	}
	log.Printf("login user:%v", *user)
	if AssetsConfig().App.ClientVersion != *version {
		log.Printf("login user:%v client outdated %v:%v", *user, AssetsConfig().App.ClientVersion, *version)
		SendError(from, msgid, proto.Error_Login_OutdatedVersion)
		return
	}
	//update account database
	a, ok := amap[*user]
	if pass := req.Pass; pass != nil {
	log.Printf("login user/pass:%v:%v", *user, *pass)
		if ok {
			rescue := req.Rescue;
			if rescue == nil || *rescue != a.rescue {
				SendError(from, msgid, proto.Error_Login_UserAlreadyExists)
				return
			}
		}
		secret := compute_user_secret(*user, *pass, *walltime)
		a = Account {
			user: *user,
			secret: secret,
		}
		amap[*user] = a
	} else {
		if !ok {
			SendError(from, msgid, proto.Error_Login_UserNotFound)
			return			
		}
		sign := req.Sign;
		log.Printf("sign:%v", sign);
		if sign == nil || *sign != compute_sign(a.user, a.secret, *walltime) {
			if sign != nil {
				log.Printf("sign differ %v:%v:%v:%v:%v", *sign, compute_sign(a.user, a.secret, *walltime), a.user, a.secret, *walltime)
			}
			SendError(from, msgid, proto.Error_Login_InvalidAuth)
			return
		}
		//TODO: with some duration, update hash
	}

	//set device information
	now := time.Now()
	device_id := req.DeviceId
	if device_id == nil {
		//TODO: get unique identifier of browser and use it as device_id.
		//(especially, if user uses mobile browser, how we identify it as same mobile device)
		tmp_device_id := "browser:" + from.String()
		device_id = &tmp_device_id
	}
	devices, ok := dmap[*user]
	if !ok {
		devices = make(map[string]Device)
		dmap[*user] = devices
	}
	device, ok := devices[*device_id]
	if !ok {
		devices[*device_id] = Device {
			id: *device_id,
			last_access: now,
			last_from: from.String(),
		}
	} else {
		device.last_access = now
		device.last_from = from.String()
	}

	//send post notification to all member in this Topic
	log.Printf("secret:%v", a.secret);
	typ := proto.Payload_LoginResponse
	from.Send(&proto.Payload {
		Type: &typ,
		Msgid: &msgid,
		LoginResponse: &proto.LoginResponse{
			Secret: &a.secret,
		},
	})
}
