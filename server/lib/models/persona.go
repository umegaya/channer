package models

import (
	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Persona struct {
	proto.Model_Persona
}

func InitPersona() {
	create_table(Persona{}, "personas", "Id")
}

