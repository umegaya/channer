package models

import (
	"log"
	"fmt"
	"bytes"
	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Reaction struct {
	proto.Model_Reaction
}

func InitReaction() {
	create_table(Reaction{}, "reactions", "Target", "Persona")
}

//create fixture
type TopicInfo struct {
	Id proto.UUID
	Point int64
	Vote uint64
}

func InsertReactionFixture(dbif Dbif) error {
	if results, err := dbif.Select(Reaction{}, dbm.Stmt("select * from %s.reactions limit 1")); err != nil || len(results) > 0 {
		if err == nil {
			log.Printf("reaction fixture already inserted")
		}
		return err
	}
	results, err := dbif.Select(TopicInfo{}, dbm.Stmt(`select id,point,vote from %s.topics`))
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
				buffer.WriteString(fmt.Sprintf("%s(%v,%v,%v,%v,%v)", 
					sep, dbm.UUID(), v.Id, dbm.UUID(), int(proto.Model_Reaction_Topic_Vote), 1))
				if len(sep) <= 0 {
					sep = ","
				}			
			}
			for i := 0 ; i < int((int64(v.Vote) - v.Point) / 2); i++ {
				buffer.WriteString(fmt.Sprintf("%s(%v,%v,%v,%v,%v)", 
					sep, dbm.UUID(), v.Id, dbm.UUID(), int(proto.Model_Reaction_Topic_Vote), -1))
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

	/*for _, a := range results {
		v := a.(*TopicInfo)
		//u + d = v, u - d = p => u = (v + p) / 2, d = (v - p) / 2
		for i := 0 ; i < int((int64(v.Vote) + v.Point) / 2); i++ {
			r := &Reaction {
				proto.Model_Reaction {
					Id: dbm.UUID(),
					Target: v.Id,
					Persona: dbm.UUID(),
					Type: proto.Model_Reaction_Topic_Vote,
					Param: 1,
				},
			}
			if err := dbif.Insert(r); err != nil {
				return err
			}
		}
		for i := 0 ; i < int((int64(v.Vote) - v.Point) / 2); i++ {
			r := &Reaction {
				proto.Model_Reaction {
					Id: dbm.UUID(),
					Target: v.Id,
					Persona: dbm.UUID(),
					Type: proto.Model_Reaction_Topic_Vote,
					Param: -1,
				},
			}
			if err := dbif.Insert(r); err != nil {
				return err
			}
		}
	}*/
	return nil
}