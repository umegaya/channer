package models

import (
	"log"
	"bytes"
	"fmt"
	"math/rand"

	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Topic struct {
	proto.Model_Topic
}

func InitTopic() {
	create_table(Topic{}, "topics", "Id")
}

//insert fixture
type ChannelInfo struct {
	Id proto.UUID
}

func InsertTopicFixture(dbif Dbif) error {
	var count uint64;
	if err := dbif.SelectOne(&count, dbm.Stmt("select count(*) from %s.topics")); err != nil {
		return err
	}
	if count > 0 {
		log.Printf("topic fixture already inserted: %v", count)
		return nil
	}
	ids, err := dbif.Select(ChannelInfo{}, dbm.Stmt(`select id from %s.channels`))
	if err != nil {
		return err
	}
	
	for i := 0; i < 30; i++ {
		var buffer bytes.Buffer
	    buffer.WriteString(dbm.Stmt("insert into %s.topics values"))
		sep := ""
		for j := 0; j < 1000; j++ {
			id := ids[rand.Int31n(int32(len(ids)))].(*ChannelInfo).Id
			uv, dv := rand.Int31n(25), rand.Int31n(25)
			buffer.WriteString(fmt.Sprintf("%s(%v,%v,'%s',%v,%v,%v)", 
				sep, dbm.UUID(), id, fmt.Sprintf("debug topic %d-%d", i + 1, j + 1), 
				uv - dv, uint32(uv + dv), uint32(rand.Int31n(100))))
			if len(sep) <= 0 {
				sep = ","
			}
		}
		buffer.WriteString(";")
		if _, err := dbif.Exec(buffer.String()); err != nil {
			return err
		}
	}
/*	for i := 0; i < 30000; i++ {
		id := ids[rand.Int31n(int32(len(ids)))].(*ChannelInfo).Id
		uv, dv := rand.Int31n(25), rand.Int31n(25)
		ch := &Topic {
			proto.Model_Topic {
				Id: dbm.UUID(),
				Channel: id,
				Name: fmt.Sprintf("debug topic %d", (i + 1)), 
				Point: uv - dv,
				Vote: uint32(uv + dv),
				Comment: uint32(rand.Int31n(100)),
			},
		}
		if err := dbif.Insert(ch); err != nil {
			return err
		}
	} */
	return nil
}