package models

import (
	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Reaction struct {
	proto.Model_Reaction
}

func InitReaction() {
	create_table(Reaction{}, "reactions", "Target", "Persona")
}

