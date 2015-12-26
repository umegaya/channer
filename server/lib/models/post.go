package models

import (
)

//Account represents one user account
type Post struct {
	Id UUID //encoded hlc (unixtime + topic-unique-logical_ts). should be generated with txn with topics table.
	Topic UUID //parent topic id
	Persona uint64 //persona who post it.
	Attr uint64 //attr flag (banned or something)
	Text string //posted text
}

func InitPost() {
	ConfigTable(Post{}, "posts", "Id")
}

