package packet

import (
	proto "../../proto"
)

func ProcessLogin(from Source, msgid uint32, req *proto.PingRequest, t Transport) {
	//TODO: save post data into database 

	//send post notification to all member in this Topic
	typ := proto.Payload_LoginResponse
	from.Send(&proto.Payload {
		Type: &typ,
		Msgid: &msgid,
		LoginResponse: &proto.LoginResponse{
			Walltime: req.Walltime,
		},
	})
}
