package models

import (
)

//Account represents one user account
type Persona struct {
	Id UUID
	Channel UUID
	Account UUID
}

func InitPersona() {
	ConfigTable(Persona{}, "personas", "Id")
}

