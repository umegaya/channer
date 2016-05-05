package models

import (
	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Service struct {
	proto.Model_Service
}

func InitService() {
	create_table(Service{}, "services", "Id")
}

