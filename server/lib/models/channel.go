package models

import (
)

//Account represents one user account
type Channel struct {
	Id uint64
	Name string
	Style string
}

func InitChannel() {
	DBM().AddTableWithName(Channel{}, "channels").SetKeys(true, "Id")
}

