package packets

import (
	"log"
	
	proto "github.com/umegaya/channer/server/proto"
	"github.com/umegaya/channer/server/lib/models"
)

func ProcessLogin(from Source, msgid uint32, req *proto.LoginRequest, t Transport) {
	user := req.User
	version := req.Version
	if AssetsConfig().App.ClientVersion != version {
		log.Printf("login user:%v client outdated %v:%v", user, AssetsConfig().App.ClientVersion, version)
		SendError(from, msgid, proto.Error_Login_OutdatedVersion)
		return
	}
	rescue := req.Rescue
	if rescue != nil {
		a, err := models.FindRescueAccount(*rescue)
		if err != nil {
			SendError(from, msgid, proto.Error_Rescue_CannotRescue)
			return
		}
		req.User = a.User
		req.Mail = a.Mail
		req.Id = &a.Id
		req.Pass = &a.Pass 
		log.Printf("account %v rescue is enabled %v, force override secret", a.Id, *rescue)
	}
	walltime := req.Walltime
	//update account database
	a, created, err := models.NewAccount(models.DBM(), req.Id, proto.Model_Account_User, user, req.Mail)
	if err != nil {
		log.Printf("login create account database error: %v", err)
		SendError(from, msgid, proto.Error_Login_DatabaseError)
		return
	}
	if pass := req.Pass; pass != nil {
		if !created {
			if *pass != a.Pass {
				SendError(from, msgid, proto.Error_Login_UserAlreadyExists)
				return
			}
		}
		secret := a.ComputeSecret(*pass, walltime)
		a.Secret = secret
		a.Pass = *pass
		log.Printf("login database %v %v", a.User, a.Secret);
		if _, err := a.Save(models.DBM(), []string{ "Secret", "Pass" }); err != nil {
			log.Printf("login update account database error: %v", err)
			SendError(from, msgid, proto.Error_Login_DatabaseError)
			return
		}
	} else {
		if created {
			SendError(from, msgid, proto.Error_Login_UserNotFound)
			return
		}
		sign := req.Sign;
		log.Printf("sign:%v", *sign);
		if sign == nil || !a.VerifySign(*sign, walltime) {
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
		tmp_device_id := "browser:" + a.StringId()
		tmp_device_type := "browser"
		device_id = &tmp_device_id
		device_type = &tmp_device_type
	}
	if _, _, err := models.NewDevice(models.DBM(), *device_id, *device_type, from.String(), a.Id); err != nil {
		log.Printf("register device fails %v:%v:%v:%v", *device_id, *device_type, a.Id, err)
		//continue
	}
	//compute response
	resp := &proto.LoginResponse{
		Id: a.Id,
		Secret: a.Secret,
	}
	if rescue != nil {
		resp.Pass = req.Pass
		resp.Mail = &req.Mail
		resp.User = &req.User
	}
	//send post notification to all member in this Topic
	log.Printf("secret:%v, id:%v", a.Secret, a.Id)
	from.SetAccount(a)
	from.Send(&proto.Payload {
		Type: proto.Payload_LoginResponse,
		Msgid: msgid,
		LoginResponse: resp,
	})
}
