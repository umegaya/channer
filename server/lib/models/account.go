package models

import (
	"log"
	"fmt"
	"strconv"

	proto "../../proto"
)

//Account represents one user account
type Account struct {
	proto.Model_Account
}

const ACCOUNT_ID_BASE = 36

func InitAccount() {
	create_table(Account{}, "accounts", "Id")
}

func NewAccount(id *string, typ proto.Model_Account_Type, user string) (*Account, bool, error) {
	dbm := DBM()
	a := &Account{}
	created := false
	if id == nil {
		a.Id = uint64(dbm.UUID())
		a.User = user
		a.Type = typ
		//newly created
		if err := dbm.Insert(a); err != nil {
			return nil, false, err
		}
		log.Printf("a = %v", a)
		created = true
	} else {
		tmp, err := strconv.ParseUint(*id, ACCOUNT_ID_BASE, 64)
		if err != nil {
			return nil, false, fmt.Errorf("invalid account id: %v", *id)
		}
		a.Id = tmp
	}
	if err := dbm.SelectOne(a, "select * from accounts where id=$1", a.Id); err != nil {
		return nil, false, err
	}
	return a, created, nil
}

func (a *Account) Save(cols []string) (int64, error) {
	return DBM().StoreColumns(a, cols)
}

func (a Account) Proto() proto.Model_Account {
	return a.Model_Account
}
