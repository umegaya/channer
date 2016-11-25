package models

import (
	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Persona struct {
	proto.Model_Persona
}

func InitPersona() {
	t := create_table(Persona{}, "personas", "Id")
	t.AddIndex("account_channel", "INDEX", []string{"Account", "Channel"})
}

func FindPersona(dbif Dbif, account, channel proto.UUID) (*Persona, error) {
	p := &Persona{
		proto.Model_Persona {
			Account: account,
			Channel: channel,
		},
	}
	if err := dbif.SelectOne(p, dbm.Stmt("select * from %s.personas where account=$1 and channel=$2"), account, channel); err != nil {
		return nil, err
	}
	return p, nil
}
