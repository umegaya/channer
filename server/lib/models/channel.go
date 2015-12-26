package models

import (
)

//Account represents one user account
type Channel struct {
	Id UUID
	Name string
	Style string
}

func InitChannel() {
	ConfigTable(Channel{}, "channels", "Id")
}

