package models

import (
)

//Account represents one user account
type Service struct {
	Id UUID
	Channel UUID //attached channel
	Account UUID //bot account id
}

func InitService() {
	ConfigTable(Service{}, "services", "Id")
}

