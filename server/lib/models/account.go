package models

import (
	"log"
	"fmt"
	"strconv"
)

//Account represents one user account
type Account struct {
	Id UUID
	User string
	//0: human, 1: bot
	Type int
	Secret string
	//when user forget password, we set some random hash here and login command with same value of this, can replace hash with new value
	Rescue string 
}

const ACCTYPE_USER = 0
const ACCTYPE_BOT = 1

const ACCOUNT_ID_BASE = 36

func InitAccount() {
	create_table(Account{}, "accounts", "Id")
}

func NewAccount(id *string, typ int, user string) (*Account, bool, error) {
	dbm := DBM()
	a := &Account{}
	created := false
	if id == nil {
		a.Id = dbm.UUID()
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
		a.Id = UUID(tmp)
	}
	if err := dbm.SelectOne(a, "select * from accounts where id=$1", a.Id); err != nil {
		return nil, false, err
	}
	return a, created, nil
}

func (a *Account) Save(cols []string) (int64, error) {
	return DBM().StoreColumns(a, cols)
}
