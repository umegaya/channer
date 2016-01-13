package packets

import (
	proto "../../proto"
)

func ProcessChannelCreate(from Source, msgid uint32, req *proto.ChannelCreateRequest, t Transport) {
	//send post notification to all member in this Topic
	from.Send(&proto.Payload {
		Type: proto.Payload_ChannelCreateResponse,
		Msgid: msgid,
		ChannelCreateResponse: &proto.ChannelCreateResponse{
			ChannelId: 123,
		},
	})
}

func ProcessChannelList(from Source, msgid uint32, req *proto.ChannelListRequest, t Transport) {
	//send post notification to all member in this Topic
	from.Send(&proto.Payload {
		Type: proto.Payload_ChannelListResponse,
		Msgid: msgid,
		ChannelListResponse: &proto.ChannelListResponse{
			List: make([]*proto.Model_Channel, 0),
		},
	})
}

