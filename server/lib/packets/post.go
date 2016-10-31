package packets

import (
	"log"

	proto "github.com/umegaya/channer/server/proto"
	"github.com/umegaya/channer/server/lib/models"
)

func ProcessPostCreate(from Source, msgid uint32, req *proto.PostCreateRequest, t Transport) {
		log.Printf("ProcessPostCreate");

	p, err := models.NewPost(models.DBM(), from.Account(), req)
	if err != nil {
		log.Printf("err: %v", err);
		SendError(from, msgid, err)
		return
	}
		log.Printf("ProcessPostCreate success");
	//send post notification to all member in this Topic
	from.Send(&proto.Payload {
		Type: proto.Payload_PostCreateResponse,
		Msgid: msgid,
		PostCreateResponse: &proto.PostCreateResponse{
			Created: &p.Model_Post,
		},
	})
}

func ProcessPostList(from Source, msgid uint32, req *proto.PostListRequest, t Transport) {
	ps, err := models.ListPost(models.DBM(), req)
	if err != nil {
		log.Printf("err: %v", err);
		SendError(from, msgid, err)
		return
	}

	from.Send(&proto.Payload {
		Type: proto.Payload_PostListResponse,
		Msgid: msgid,
		PostListResponse: &proto.PostListResponse {
			List: ps,
		},
	})
}
