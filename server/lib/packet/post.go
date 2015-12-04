package packet

import (
	proto "../../proto"
)

func Process(post *proto.PostRequest, t Transport) {
	//TODO: save post data into database 

	//send post notification to all member in this Topic
	typ := proto.Payload_PostNotify
	t.Send(&TopicDestination{
		TopicId: *post.TopicId,
	}, &proto.Payload {
		Type: &typ,
		PostNotify: post.Post,
	})
}

