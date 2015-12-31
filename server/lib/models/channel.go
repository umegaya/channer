package models

import (
	proto "../../proto"
)

//Account represents one user account
type Channel struct {
	proto.Model_Channel
}

func InitChannel() {
	create_table(Channel{}, "channels", "Id")
}

