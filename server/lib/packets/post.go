package packets

import (
	proto "../../proto"
)

func ProcessPost(from Source, msgid uint32, post *proto.PostRequest, t Transport) {
	//TODO: save post data into database 

	//send post notification to all member in this Topic
	t.Send(&TopicDestination{
		TopicId: post.TopicId,
	}, &proto.Payload {
		Type: proto.Payload_PostNotify,
		PostNotify: post.Post,
	})

	from.Send(&proto.Payload {
		Type: proto.Payload_PostResponse,
		Msgid: msgid,
		PostResponse: &proto.PostResponse {
			PostedAt: &proto.HLC { 
				Walltime: 0, 
				LogicalTs: 0,
			},
		},
	})
}
