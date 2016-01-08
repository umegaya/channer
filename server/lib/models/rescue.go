package models

import (
	"fmt"
	"time"
	"crypto/rand"
	"encoding/hex"

	proto "../../proto"
)

//Account represents one user account
type Rescue struct {
	proto.Model_Rescue
}

func InitRescue() {
	create_table(Rescue{}, "rescues", "Id").AddIndex("account", "INDEX", []string{"Account"})
}

func NewRescue(dbif Dbif, account string) (*Rescue, error) {
	res := &Rescue {
		proto.Model_Rescue {
			Id: make([]byte, 16),
			Account: account,
		},
	}
	if err := dbif.SelectOne(res, "select * from rescues where account=$1", res.Account); err == nil {
		if res.RemainTime() > 0 {
			return res, nil
		}
		dbif.Exec("delete from rescues where id=$1", res.Id);
	}
	res.ValidDate = time.Now().Add(72 * time.Hour).UnixNano()
RETRY:
	rand.Read(res.Id)
	if err := dbif.SelectOne(res, "select * from rescues where id=$1", res.Id); err == nil {
		goto RETRY
	}
	if err := dbif.Insert(res); err != nil {
		return nil, err
	}
	return res, nil
}

func FindRescueAccount(rescue string) (*Account, error) {
	var (
		tmp []byte
		err error
	) 
	tmp, err = hex.DecodeString(rescue)
	if err != nil {
		return nil, err
	}
	res := &Rescue {
		proto.Model_Rescue {
			Id: tmp,
		},
	}
	var a *Account
	if err = dbm.Txn(func (tx Dbif) error {
		if err = tx.SelectOne(res, "select * from rescues where id=$1", res.Id); err != nil {
			return err
		}
		if res.RemainTime() <= 0 {
			return fmt.Errorf("outdated rescue entry: %v %v", time.Now().UnixNano(), res.ValidDate)
		}
		a, err = FindAccount(tx, res.Account)
		if err != nil {
			return err
		}
		//invalidate rescue record
		res.ValidDate = 0
		if _, err = res.Save(tx, []string{"ValidDate"}); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return a, nil
}

func (r *Rescue) Save(dbif Dbif, cols []string) (int64, error) {
	return StoreColumns(dbif, r, cols)
}

func (r *Rescue) URL() string {
	return fmt.Sprintf("/rescue/%v", hex.EncodeToString(r.Id))
}

func (r *Rescue) RemainTime() int64 {
	dur := (r.ValidDate - time.Now().UnixNano())
	if dur < 0 {
		return 0
	}
	return dur
}
