package models

import (
	proto "../../proto"
)

//Account represents one user account
type Persona struct {
	proto.Model_Persona
}

func InitPersona() {
	create_table(Persona{}, "personas", "Id")
}

