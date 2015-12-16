package models

import (
)

//Account represents one user account
type Account struct {
	Id uint64
	User string
	//0: human, 1: bot
	Type int
	Secret string
	//when user forget password, we set some random hash here and login command with same value of this, can replace hash with new value
	Rescue string 
}

func InitAccount() {
	DBM().AddTableWithName(Account{}, "accounts").SetKeys(true, "Id")
}

func NewAccount(id *uint64, typ int) (*Account, bool, error) {
	dbm := DBM()
	var tmp uint64 = 0
	if id != nil {
		tmp = *id
	}
	a := &Account{
		Id: tmp,
		Type: typ,
	}
	if err := dbm.SelectOne(&a, "select * from accounts where id=$1", a.Id); err != nil {
		//newly created
		return a, true, nil
	}
	return a, false, nil
}

func (a *Account) Save() (int64, error) {
	return DBM().Update(a)
}
