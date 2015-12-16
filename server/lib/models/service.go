package models

import (
)

//Account represents one user account
type Service struct {
	Id uint64
	Channel uint64 //attached channel
	Account uint64 //bot account id
}

func InitService() {
	DBM().AddTableWithName(Service{}, "services").SetKeys(true, "Id")
}

