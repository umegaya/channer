package models

import (
	"log"
	"time"

	proto "../../proto"
)

//Account represents one user account
type Device struct {
	proto.Model_Device
}

func InitDevice() {
	create_table(Device{}, "devices", "Id")
}

func NewDevice(id, typ, from string, account UUID) (*Device, bool, error) {
	dbm := DBM()
	d := &Device{}
	if err := dbm.SelectOne(d, "select * from devices where id=$1", id); err != nil {
		log.Printf("device select fails: %v %v", err, id)
		d.Id = id
		d.Type = typ
		d.Account = uint64(account)
		d.LastFrom = from
		d.LastAccess = time.Now().UnixNano()
		//TODO: check err is "not found" or not.
		if err := dbm.Insert(d); err != nil {
			return nil, false, err
		}
		//newly created
		return d, true, nil
	}
	d.LastFrom = from
	d.LastAccess = time.Now().UnixNano()
	if _, err := dbm.StoreColumns(d, []string{"LastFrom", "LastAccess"}); err != nil {
		return d, false, err
	}
	return d, false, nil
}
