package models

import (
	"log"
	"bytes"
	"fmt"
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
	create_table(Topic{}, "topics", "Id")
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
		Title: req.Name,
		ChannelName: c.Name,
		Content: req.Content,
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
	id proto.UUID
	score uint32
	vote uint32
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
		ids[i] = string(ent.id)
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
			ci := ids[rand.Int31n(int32(len(ids)))].(*ChannelInfo)
			body := proto.Model_Topic_Body {
				Title: fmt.Sprintf("debug topic %d-%d", i + 1, j + 1),
				ChannelName: ci.Name,
				Content: "text text text text text text text text text text text text text text text text text text text text",
			}
			bs, err := body.Marshal()
			if err != nil {
				return err
			}
			id := ci.Id
			uv, dv := rand.Int31n(25), rand.Int31n(25)
			buffer.WriteString(fmt.Sprintf("%s(%v,%v,%v,%v,%v,%v,%s)", 
				sep, dbm.UUID(), id, dbm.UUID(), 
				uv - dv, uint32(uv + dv), uint32(rand.Int31n(100)), bytesColumnEncode(bs)))
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