package models

import (
)

//Account represents one user account
type Topic struct {
	Id UUID
	Name string
}

func InitTopic() {
	ConfigTable(Topic{}, "topics", "Id")
}

