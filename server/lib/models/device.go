package models

import (
	"time"
)

//Account represents one user account
type Device struct {
	Id string
	//each of ios, android, wp8
	Type string
	//owner account id indexed.
	Account uint64
	LastFrom string
	LastAccess time.Time
}

func InitDevice() {
	DBM().AddTableWithName(Device{}, "devices").SetKeys(true, "Id")
}

func NewDevice(id, typ, from string, account uint64) (*Device, bool, error) {
	dbm := DBM()
	d := &Device{
		Id: id,
		Type: typ,
		Account: account,
		LastFrom: from,
		LastAccess: time.Now(),
	}
	if err := dbm.SelectOne(&d, "select * from devices where id=$1", d.Id); err != nil {
		//TODO: check err is "not found" or not.
		if err := dbm.Insert(&d); err != nil {
			return nil, false, err
		}
		//newly created
		return d, true, nil
	}
	if _, err := dbm.Update(&d); err != nil {
		return nil, false, err
	}
	return d, false, nil
}
