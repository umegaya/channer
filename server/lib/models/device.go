package models

import (
	//"log"
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

func NewDevice(dbif Dbif, id, typ, from string, account proto.UUID) (*Device, bool, error) {
	d := &Device{}
	if err := dbif.SelectOne(d, dbm.Stmt("select * from %s.devices where id=$1"), id); err != nil {
		d.Id = id
		d.Type = typ
		d.Account = account
		d.LastFrom = from
		d.LastAccess = time.Now().UnixNano()
		//TODO: check err is "not found" or not.
		if err := dbif.Insert(d); err != nil {
			return nil, false, err
		}
		//newly created
		return d, true, nil
	}
	d.LastFrom = from
	d.LastAccess = time.Now().UnixNano()
	if _, err := StoreColumns(dbif, d, []string{"LastFrom", "LastAccess"}); err != nil {
		return d, false, err
	}
	return d, false, nil
}
