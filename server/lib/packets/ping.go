package packets

import (
	proto "../../proto"
)

func ProcessPing(from Source, msgid uint32, req *proto.PingRequest, t Transport) {
	//TODO: save post data into database 

	//send post notification to all member in this Topic
	from.Send(&proto.Payload {
		Type: proto.Payload_PingResponse,
		Msgid: msgid,
		PingResponse: &proto.PingResponse{
			Walltime: req.Walltime,
		},
	})
}
