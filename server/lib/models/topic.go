package models

import (
	"log"
	"bytes"
	"fmt"
	"strconv"
	"strings"
	"math/rand"

	proto "github.com/umegaya/channer/server/proto"
	"github.com/umegaya/yue"
)

//Account represents one user account
type Topic struct {
	proto.Model_Topic
}

func InitTopic() {
	t := create_table(Topic{}, "topics", "Id")
	t.AddIndex("locale", "INDEX", []string{"Locale"})
}

const TOPIC_FETCH_LIMIT = 50

func NewTopic(dbif Dbif, a *Account, req *proto.TopicCreateRequest) (*Topic, error) {
	var (
		p *Persona
		c *Channel
		err error
	)
	if p, err = a.Persona(dbif, req.Channel); err != nil {
		return nil, &proto.Err{ Type: proto.Error_TopicCreate_NoPersonaError }
	}
	if c, err = FindChannel(dbif, req.Channel); err != nil {
		return nil, &proto.Err{ Type: proto.Error_TopicCreate_DatabaseError }
	}
	body := proto.Model_Topic_Body {
		ChannelName: c.Name,
		Name: p.Name,
	}
	bs, err := body.Marshal()
	if err != nil {
		return nil, &proto.Err{ Type: proto.Error_TopicCreate_DatabaseError }
	}
	tp := &Topic {
		proto.Model_Topic {
			Id: dbm.UUID(),
			Channel: req.Channel, 
			Persona: p.Id,
			Body: bs,
		},
	}
	if err = dbif.Insert(tp); err != nil {
		return nil, &proto.Err{ Type: proto.Error_TopicCreate_DatabaseError }
	}
	return tp, nil
}

//return value of actor call
type HotEntry struct {
	Id proto.UUID
	Score uint32
	Vote uint32
}

func ListTopic(dbif Dbif, req *proto.TopicListRequest) ([]*proto.Model_Topic, error) {
	var limit int32
	if req.Limit > 0 {
		limit = req.Limit
		if limit > TOPIC_FETCH_LIMIT {
			limit = TOPIC_FETCH_LIMIT
		}
	} else {
		limit = TOPIC_FETCH_LIMIT
	}

	var entries []HotEntry
	if err := yue.Call(fmt.Sprintf("/hot/%s", req.Locale), "Query", req.Bucket, req.Query, nil, req.OffsetId, limit, &entries); err != nil {
		return nil, err
	}
	ids := make([]string, len(entries))
	for i, ent := range entries {
		ids[i] = strconv.FormatUint(uint64(ent.Id), 10)
	}
	tps, err := dbif.Select(Topic{}, dbm.Stmt(`select * from %s.topics where id in (%s)`, strings.Join(ids, ",")))
	if err != nil {
		return nil, err
	}
	ret := make([]*proto.Model_Topic, len(tps))
	for i, tp := range tps {
		tpp := tp.(*Topic).Model_Topic
		ret[i] = &tpp
	}
	return ret, nil
}



//insert fixture
type ChannelInfo struct {
	Id proto.UUID
	Name string
}

func InsertTopicFixture(dbif Dbif) error {
	locales := Locales()
	var count uint64;
	if err := dbif.SelectOne(&count, dbm.Stmt("select count(*) from %s.topics")); err != nil {
		return err
	}
	if count > 0 {
		log.Printf("topic fixture already inserted: %v", count)
		return nil
	}
	ids, err := dbif.Select(ChannelInfo{}, dbm.Stmt(`select id,name from %s.channels`))
	if err != nil {
		return err
	}
	
	for i := 0; i < 30; i++ {
		var buffer bytes.Buffer
	    buffer.WriteString(dbm.Stmt("insert into %s.topics values"))
		sep := ""
		for j := 0; j < 1000; j++ {
			user_id := dbm.UUID()
			ci := ids[rand.Int31n(int32(len(ids)))].(*ChannelInfo)
			body := proto.Model_Topic_Body {
				ChannelName: ci.Name,
				Name: fmt.Sprintf("user-%v", user_id),
			}
			bs, err := body.Marshal()
			if err != nil {
				return err
			}
			id := ci.Id
			uv, dv := rand.Int31n(25), rand.Int31n(25)
			buffer.WriteString(fmt.Sprintf("%s(%v,%v,%v,'%s',0,%v,%v,%v,'%s','%s',%s)", 
				sep, dbm.UUID(), id, user_id, locales[rand.Int31n(int32(len(locales)))],
				uv - dv, uint32(uv + dv), uint32(rand.Int31n(100)), 
				fmt.Sprintf("debug topic %d-%d", i + 1, j + 1),
				"text text text text text text text text text text text text text text text text text text text text",				
				bytesColumnEncode(bs)))
			if len(sep) <= 0 {
				sep = ","
			}
		}
		buffer.WriteString(";")
		if _, err := dbif.Exec(buffer.String()); err != nil {
			return err
		}
	}
	return nil
}