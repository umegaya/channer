package models

import (
)

//Account represents one user account
type Topic struct {
	Id UUID
	Name string
}

func InitTopic() {
	create_table(Topic{}, "topics", "Id")
}

