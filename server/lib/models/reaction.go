package models

import (
	proto "../../proto"
)

//Account represents one user account
type Reaction struct {
	proto.Model_Reaction
}

func InitReaction() {
	create_table(Reaction{}, "reactions", "Id")
}

