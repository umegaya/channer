package models

import (
)

//Account represents one user account
type Topic struct {
	Id uint64
	Name string
}

func InitTopic() {
	DBM().AddTableWithName(Topic{}, "topics").SetKeys(true, "Id")
}

