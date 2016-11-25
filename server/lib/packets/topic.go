package packets

import (
	"log"

	proto "github.com/umegaya/channer/server/proto"
	"github.com/umegaya/channer/server/lib/models"
)

func ProcessTopicCreate(from Source, msgid uint32, req *proto.TopicCreateRequest, t Transport) {
	tp, err := models.NewTopic(models.DBM(), from.Account(), req)
	if err != nil {
		log.Printf("err: %v", err);
		SendError(from, msgid, err)
		return
	}
	//send post notification to all member in this Topic
	from.Send(&proto.Payload {
		Type: proto.Payload_TopicCreateResponse,
		Msgid: msgid,
		TopicCreateResponse: &proto.TopicCreateResponse{
			Created: &tp.Model_Topic,
		},
	})
}

func ProcessTopicList(from Source, msgid uint32, req *proto.TopicListRequest, t Transport) {
	tps, err := models.ListTopic(models.DBM(), req)
	if err != nil {
		log.Printf("err: %v", err);
		SendError(from, msgid, err)
		return
	}
	//send post notification to all member in this Topic
	from.Send(&proto.Payload {
		Type: proto.Payload_TopicListResponse,
		Msgid: msgid,
		TopicListResponse: &proto.TopicListResponse{
			List: tps,
		},
	})
}

