package models

import (
	"log"
	"fmt"
	"bytes"
	"strconv"
	"crypto/sha256"
	"encoding/base64"

	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Account struct {
	proto.Model_Account
	pmap map[proto.UUID]*Persona `db:"-"`
}

const ACCOUNT_ID_BASE = 36

func InitAccount() {
	create_table(Account{}, "accounts", "Id")
}

func NewAccount(dbif Dbif, id *proto.UUID, typ proto.Model_Account_Type, user string, mail string) (*Account, bool, error) {
	a := &Account{}
	created := false
	if id == nil {
		a.Id = dbm.UUID()
		a.User = user
		a.Mail = mail
		a.Type = typ
		//newly created
		if err := dbif.Insert(a); err != nil {
			return nil, false, err
		}
		log.Printf("a = %v", a)
		created = true
	} else {
		a.Id = *id
	}
	if err := dbif.SelectOne(a, dbm.Stmt("select * from %s.accounts where id=$1"), a.Id); err != nil {
		return nil, false, err
	}
	a.pmap = make(map[proto.UUID]*Persona)
	return a, created, nil
}

func FindAccount(dbif Dbif, id proto.UUID) (*Account, error) {
	a := &Account{
		proto.Model_Account {
			Id: id,
		}, make(map[proto.UUID]*Persona),
	}
	if err := dbif.SelectOne(a, dbm.Stmt("select * from %s.accounts where id=$1"), a.Id); err != nil {
		return nil, err
	}
	return a, nil
}

func (a *Account) Save(dbif Dbif, cols []string) (int64, error) {
	return StoreColumns(dbif, a, cols)
}

func (a *Account) Proto() proto.Model_Account {
	return a.Model_Account
}

func (a *Account) StringId() string {
	return strconv.FormatUint(uint64(a.Id), ACCOUNT_ID_BASE)
}

func (a *Account) Persona(dbif Dbif, channel proto.UUID) (*Persona, error) {
	if p, ok := a.pmap[channel]; ok {
		return p, nil
	} else {
		p, err := FindPersona(dbif, a.Id, channel)
		if err != nil {
			return nil, err
		}
		a.pmap[channel] = p
		return p, nil
	}
}


//master secret TODO: load it from config
var SECRET string = "506779d073f0c20d5e14c62c7261db6bd238be7312ebef394ca1b05226740742";

//cals_sha256 is handy methods for calculating sha256 string from string.
func calc_sha256(source string) string {
	shabytes := sha256.Sum256(bytes.NewBufferString(source).Bytes())
	return base64.StdEncoding.EncodeToString(shabytes[:sha256.Size])
}

//compute_sign is calculate signature of login request.
func compute_sign(id uint64, secret string, walltime uint64) string {
	src := strconv.FormatUint(walltime, 10) + strconv.FormatUint(id, 10) + secret
	return calc_sha256(src)
}

//compute_user_secret calculates secret for users
func compute_user_secret(id uint64, pass string, walltime uint64) string {
	return calc_sha256(strconv.FormatUint(walltime, 10) + strconv.FormatUint(id, 10) + pass + SECRET)
}

func (a *Account) ComputeSecret(pass string, walltime uint64) string {
	return compute_user_secret(uint64(a.Id), pass, walltime)
}

func (a *Account) ComputeSign(walltime uint64) string {
	return compute_sign(uint64(a.Id), a.Secret, walltime)
}

func (a *Account) VerifySign(sign string, walltime uint64) bool {
	computed := a.ComputeSign(walltime)
	if sign == computed {
		return true
	}
	log.Printf("invalid sign %v:%v:%v:%v:%v", sign, computed, a.Id, a.Secret, walltime)
	return false
}

func (a *Account) CanCreateChannel(created uint64) error {
	if created > 0 {
		return fmt.Errorf("too many channel created")
	}
	return nil
}
