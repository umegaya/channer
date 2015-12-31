package models

import (
	proto "../../proto"
)

//Account represents one user account
type Service struct {
	proto.Model_Service
}

func InitService() {
	create_table(Service{}, "services", "Id")
}

