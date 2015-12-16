package models

import (
)

//Account represents one user account
type Reaction struct {
	Id uint64 //encoded hlc (unixtime + topic-unique-logical_ts). should be generated with txn with topics table.
	Post uint64 //parent post id
	Type uint //0: star, 1: other emoji reactions, 2: special reactions (like ban)
	Persona uint64 //persona who react it.
	Text string //0: empty string, 1: emoji definition. 2: misc data (maybe JSON)
}

func InitReaction() {
	DBM().AddTableWithName(Reaction{}, "reactions").SetKeys(true, "Id")
}

