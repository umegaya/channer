package packets

import (
	"log"

	proto "github.com/umegaya/channer/server/proto"
	"github.com/umegaya/channer/server/lib/models"
)

func ProcessChannelCreate(from Source, msgid uint32, req *proto.ChannelCreateRequest, t Transport) {
	ch, err := models.NewChannel(models.DBM(), from.Account(), req)
	if err != nil {
		log.Printf("err: %v", err);
		SendError(from, msgid, proto.Error_ChannelCreate_DatabaseError)
		return
	}
	//send post notification to all member in this Topic
	from.Send(&proto.Payload {
		Type: proto.Payload_ChannelCreateResponse,
		Msgid: msgid,
		ChannelCreateResponse: &proto.ChannelCreateResponse{
			Channel: &ch.Model_Channel,
		},
	})
}

func ProcessChannelList(from Source, msgid uint32, req *proto.ChannelListRequest, t Transport) {
	chs, err := models.ListChannel(models.DBM(), req)
	if err != nil {
		log.Printf("err: %v", err);
		SendError(from, msgid, proto.Error_ChannelList_DatabaseError)
		return
	}
	//send post notification to all member in this Topic
	from.Send(&proto.Payload {
		Type: proto.Payload_ChannelListResponse,
		Msgid: msgid,
		ChannelListResponse: &proto.ChannelListResponse{
			List: chs,
		},
	})
}

