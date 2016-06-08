package models

import (
	"log"
	"bytes"
	"fmt"
	"math/rand"
	"strings"

	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Channel struct {
	proto.Model_Channel
}

func InitChannel() {
	t := create_table(Channel{}, "channels", "Id")
	t.AddIndex("established", "INDEX", []string{"Established"})
	t.AddIndex("category", "INDEX", []string{"Category"})
	t.AddIndex("locale", "INDEX", []string{"Locale"})
	t.AddIndex("watcher", "INDEX", []string{"Watcher"})
}

const CHANNEL_FETCH_LIMIT = 50

func NewChannel(dbif Dbif, a *Account, req *proto.ChannelCreateRequest) (*Channel, error) {
	var count uint64
	if err := dbif.SelectOne(&count, dbm.Stmt("select count(*) from %s.channels where established = $1"), a.Id); err != nil {
		return nil, err
	}
	if err := a.CanCreateChannel(count); err != nil {
		return nil, err
	}
	bytes, err := req.Options.Marshal()
	if err != nil {
		return nil, err
	}
	ch := &Channel {
		proto.Model_Channel {
			Id: dbm.UUID(),
			Name: req.Name, 
			Description: req.Description,
			Style: req.Style,
			Locale: req.Locale,
			Category: req.Category,
			Watcher: 0, //TODO: add creator as watcher
			Established: a.Id,
			Options: bytes,
		},
	}
	if err := dbif.Insert(ch); err != nil {
		return nil, err
	}
	return ch, nil
}

func FindChannel(dbif Dbif, id proto.UUID) (*Channel, error) {
	c := &Channel{
		proto.Model_Channel {
			Id: id,
		},
	}
	if err := dbif.SelectOne(c, dbm.Stmt("select * from %s.channels where id=$1"), c.Id); err != nil {
		return nil, err
	}
	return c, nil
}

func ListChannel(dbif Dbif, req *proto.ChannelListRequest) ([]*proto.Model_Channel, error) {
	var limit int32
	if req.Limit > 0 {
		limit = req.Limit
		if limit > CHANNEL_FETCH_LIMIT {
			limit = CHANNEL_FETCH_LIMIT
		}
	} else {
		limit = CHANNEL_FETCH_LIMIT
	}
	tmp := make([]string, 0)
	cond := ""
	order_by := "id desc"
	if req.Query == proto.ChannelListRequest_New {
		if req.OffsetId != nil {
			tmp = append(tmp, fmt.Sprintf("id < %v", *req.OffsetId))
		}
	} else if req.Query == proto.ChannelListRequest_Popular {
		if req.OffsetId != nil {
			tmp = append(tmp, fmt.Sprintf("watcher < %v", *req.OffsetId))
		}
	}
	if req.Category > 0 {
		tmp = append(tmp, fmt.Sprintf("category = %d", req.Category))
	}
	if len(req.Locale) > 0 {
		tmp = append(tmp, fmt.Sprintf("locale = '%s'", req.Locale))
	}
	if len(tmp) > 0 {
		cond = "where " + strings.Join(tmp, " AND ")
	}
	log.Printf("offset %v limit %v", req.OffsetId, limit)
	//TODO: how to handle "popular" query type?
	chs, err := dbif.Select(Channel{}, dbm.Stmt(`select * from %s.channels %s order by %s limit %d`, cond, order_by, limit))
	if err != nil {
		return nil, err
	}
	ret := make([]*proto.Model_Channel, len(chs))
	for i, ch := range chs {
		chp := ch.(*Channel).Model_Channel
		ret[i] = &chp
	}
	return ret, nil
}

//takes about 90sec
func bytesColumnEncode(v []byte) string {
	result := make([]byte, 3 + 4*len(v))
	result[0] = 'b'
	result[1] = '\''
	start := 2
	for i := 0; i < len(v); i++ {
		b := v[i]
		result[start + 4 * i] = '\\'
		result[start + 4 * i + 1] = 'x'
		result[start + 4 * i + 2] = "0123456789abcdef"[b >> 4]
		result[start + 4 * i + 3] = "0123456789abcdef"[b & 0xf]
	}
	result[start + 4 * len(v)] = '\''
	return string(result)
}
func Locales() []string {
	return []string {"en", "ja", "ko", "zh_Hant", "zh_Hans"}	
}
func InsertChannelFixture(dbif Dbif) error {
	locales := Locales()
	categories := []string {
		"Share",
	    "Ask",
	    "Commentary",
	    "Meetup",
	    "Society",
	    "Region",
	    "Culture",
	    "Science",
	    "Humanities",
	    "Food",
	    "Life",
	    "Chat",
	    "Hobby",
	    "Sports",
	    "Game",
	    "Anime",
	    "Manga",
	    "Music",
	    "Health",
	}
	idlvs := []proto.Model_Channel_IdentityLevel {
		proto.Model_Channel_None,
		proto.Model_Channel_Topic,
		proto.Model_Channel_Channel,
		proto.Model_Channel_Account,
	}
	dstyles := []proto.Model_Channel_TopicDisplayStyle {
		proto.Model_Channel_Tail,
		proto.Model_Channel_Tree,
	}
	var count uint64;
	if err := dbif.SelectOne(&count, dbm.Stmt("select count(*) from %s.channels")); err != nil {
		return err
	}
	if count > 0 {
		log.Printf("channel fixture already inserted: %v", count)
		return nil
	}
	for i := 0; i < 10; i++ {
		var buffer bytes.Buffer
	    buffer.WriteString(dbm.Stmt("insert into %s.channels values"))
		sep := ""
		for j := 0; j < 1000; j++ {
			options := proto.Model_Channel_Options {
				Identity: idlvs[rand.Int31n(int32(len(idlvs)))],
				TopicDisplayStyle: dstyles[rand.Int31n(int32(len(dstyles)))],
				AnonymousName: "anon",
				TopicPostLimit: 1000,
			}
			bs, err := options.Marshal()
			if err != nil {
				return err
			}
			buffer.WriteString(fmt.Sprintf("%s(%v,'%s','%s',%v,'%s','%s',%v,%v,%s)", 
				sep, dbm.UUID(), 
				fmt.Sprintf("debug channel %d-%d", (i + 1), (j + 1)), 
				locales[rand.Int31n(int32(len(locales)))],
				uint32(rand.Int31n(int32(len(categories)))),
				fmt.Sprintf("this is description %d-%d", (i + 1), (j + 1)),
				"", dbm.UUID(), uint64(rand.Int63n(1000000)), bytesColumnEncode(bs)))
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
