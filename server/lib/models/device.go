package models

import (
	"log"
	"time"
)

//Account represents one user account
type Device struct {
	Id string
	//each of ios, android, wp8
	Type string
	//owner account id indexed.
	Account UUID
	LastFrom string
	LastAccess time.Time
}

func InitDevice() {
	ConfigTable(Device{}, "devices", "Id")
}

func NewDevice(id, typ, from string, account UUID) (*Device, bool, error) {
	dbm := DBM()
	d := &Device{}
	if err := dbm.SelectOne(d, "select * from devices where id=$1", id); err != nil {
		log.Printf("device select fails: %v %v", err, id)
		d.Id = id
		d.Type = typ
		d.Account = account
		d.LastFrom = from
		d.LastAccess = time.Now()
		//TODO: check err is "not found" or not.
		if err := dbm.Insert(d); err != nil {
			return nil, false, err
		}
		//newly created
		return d, true, nil
	}
	d.LastFrom = from
	d.LastAccess = time.Now()
	if _, err := update_record(d); err != nil {
		return d, false, err
	}
	return d, false, nil
}
