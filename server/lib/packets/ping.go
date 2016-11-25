package packets

import (
	proto "github.com/umegaya/channer/server/proto"
)

func ProcessPing(from Source, msgid uint32, req *proto.PingRequest, t Transport) {
	//send post notification to all member in this Topic
	from.Send(&proto.Payload {
		Type: proto.Payload_PingResponse,
		Msgid: msgid,
		PingResponse: &proto.PingResponse{
			Walltime: req.Walltime,
		},
	})
}
