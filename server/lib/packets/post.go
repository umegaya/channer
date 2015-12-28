package packets

import (
	proto "../../proto"
)

func ProcessPost(from Source, msgid uint32, post *proto.PostRequest, t Transport) {
	//TODO: save post data into database 

	//send post notification to all member in this Topic
	typ := proto.Payload_PostNotify
	t.Send(&TopicDestination{
		TopicId: *post.TopicId,
	}, &proto.Payload {
		Type: &typ,
		PostNotify: post.Post,
	})

	rtyp := proto.Payload_PostResponse
	var walltime uint64 = 0
	var lc uint32 = 0
	from.Send(&proto.Payload {
		Type: &rtyp,
		Msgid: &msgid,
		PostResponse: &proto.PostResponse {
			PostedAt: &proto.HLC { 
				Walltime: &walltime, 
				LogicalTs: &lc,
			},
		},
	})
}
