package models

import (
	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Topic struct {
	proto.Model_Topic
}

func InitTopic() {
	create_table(Topic{}, "topics", "Id")
}

