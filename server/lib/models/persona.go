package models

import (
)

//Account represents one user account
type Persona struct {
	Id uint64
	Channel uint64
	Account uint64
}

func InitPersona() {
	DBM().AddTableWithName(Persona{}, "personas").SetKeys(true, "Id")
}

