package models

import (
	"log"
	"fmt"
	"bytes"
	"math/rand"
	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Reaction struct {
	proto.Model_Reaction
}

func InitReaction() {
	t := create_table(Reaction{}, "reactions", "Id", "Persona")
	t.AddIndex("created_locale", "INDEX", []string{"Created", "Locale"})
}

//create fixture
type TopicInfo struct {
	Id proto.UUID
	Channel proto.UUID
	Point int64
	Vote uint64
}

func InsertReactionFixture(dbif Dbif) error {
	locales := Locales()
	if results, err := dbif.Select(Reaction{}, dbm.Stmt("select * from %s.reactions limit 1")); err != nil || len(results) > 0 {
		if err == nil {
			log.Printf("reaction fixture already inserted")
		}
		return err
	}
	results, err := dbif.Select(TopicInfo{}, dbm.Stmt(`select id,channel,point,vote from %s.topics`))
	if err != nil {
		return err
	}
	for i := 0; i < int(len(results) / 20); i++ {
		tmp := results[i * 20:(i + 1) * 20]
		sep := ""
		var buffer bytes.Buffer
	    buffer.WriteString(dbm.Stmt("insert into %s.reactions values"))
	   	for _, a := range tmp {
			v := a.(*TopicInfo)
			for i := 0 ; i < int((int64(v.Vote) + v.Point) / 2); i++ {
				buffer.WriteString(fmt.Sprintf("%s(%v,%v,%v,'%s',%v,%v,%v)", 
					sep, v.Id, dbm.UUID(), v.Channel, locales[rand.Int31n(int32(len(locales)))],
					int(proto.Model_Reaction_Topic_Vote), 1, dbm.UUID()))
				if len(sep) <= 0 {
					sep = ","
				}			
			}
			for i := 0 ; i < int((int64(v.Vote) - v.Point) / 2); i++ {
				buffer.WriteString(fmt.Sprintf("%s(%v,%v,%v,'%s',%v,%v,%v)", 
					sep, v.Id, dbm.UUID(), v.Channel, locales[rand.Int31n(int32(len(locales)))], 
					int(proto.Model_Reaction_Topic_Vote), -1, dbm.UUID()))
				if len(sep) <= 0 {
					sep = ","
				}			
			}
		}
		buffer.WriteString(";")
		if _, err := dbif.Exec(buffer.String()); err != nil {
			return err
		}
	}
	return nil
}