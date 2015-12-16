package packet

import (
	"log"
	"time"
	"bytes"
	"strconv"
	"crypto/sha256"
	"encoding/base64"
	
	proto "../../proto"
	"../models"
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
	id := req.Id
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
	a, created, err := models.NewAccount(id, 0)
	if err != nil {
		log.Printf("login database error2: %v", err)
		SendError(from, msgid, proto.Error_Login_DatabaseError)
		return
	}
	if pass := req.Pass; pass != nil {
	log.Printf("login user/pass:%v:%v", *user, *pass)
		if !created {
			rescue := req.Rescue;
			if rescue == nil || *rescue != a.Rescue {
				SendError(from, msgid, proto.Error_Login_UserAlreadyExists)
				return
			}
		}
		//TODO: replace user with id value
		secret := compute_user_secret(*user, *pass, *walltime)
		a.User = *user
		a.Secret = secret
		if _, err := a.Save(); err != nil {
			log.Printf("login database error: %v", err)
			SendError(from, msgid, proto.Error_Login_DatabaseError)
			return
		}
	} else {
		if created {
			SendError(from, msgid, proto.Error_Login_UserNotFound)
			return			
		}
		sign := req.Sign;
		log.Printf("sign:%v", sign);
		if sign == nil || *sign != compute_sign(a.User, a.Secret, *walltime) {
			if sign != nil {
				log.Printf("sign differ %v:%v:%v:%v:%v", *sign, compute_sign(a.User, a.Secret, *walltime), a.User, a.Secret, *walltime)
			}
			SendError(from, msgid, proto.Error_Login_InvalidAuth)
			return
		}
		//TODO: with some duration, update hash
	}

	//set device information
	device_type := req.DeviceType
	device_id := req.DeviceId
	if device_id == nil {
		//TODO: get unique identifier of browser and use it as device_id.
		//(especially, if user uses mobile browser, how we identify it as same mobile device)
		tmp_device_id := "browser:" + string(a.Id)
		tmp_device_type := "browser"
		device_id = &tmp_device_id
		device_type = &tmp_device_type
	}
	if _, _, err := models.NewDevice(*device_id, *device_type, from.String(), a.Id); err != nil {
		log.Printf("register device fails %v:%v:%v", *device_id, *device_type, a.Id)
		//continue
	}

	//send post notification to all member in this Topic
	log.Printf("secret:%v", a.Secret)
	typ := proto.Payload_LoginResponse
	from.Send(&proto.Payload {
		Type: &typ,
		Msgid: &msgid,
		LoginResponse: &proto.LoginResponse{
			Id: &a.Id,
			Secret: &a.Secret,
		},
	})
}
