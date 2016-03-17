package models

import (
	"log"
	"fmt"
	"math/rand"
	"strings"

	proto "../../proto"
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
			Established: a.Id,
			Options: bytes,
		},
	}
	if err := dbif.Insert(ch); err != nil {
		return nil, err
	}
	return ch, nil
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
	order_by := ""
	if req.Query == proto.ChannelListRequest_New {
		order_by = "id desc"
		if req.OffsetId != nil {
			tmp = append(tmp, fmt.Sprintf("id < %v", *req.OffsetId))
		}
	} else if req.Query == proto.ChannelListRequest_Popular {
		order_by = "id asc"
		if req.OffsetId != nil {
			tmp = append(tmp, fmt.Sprintf("id > %v", *req.OffsetId))
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
	log.Printf("offset %v", req.OffsetId)
	//TODO: how to handle "popular" query type?
	chs, err := dbif.Select(Channel{}, dbm.Stmt("select * from %s.channels %s order by %s limit $1", cond, order_by), limit)
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

func InsertChannelFixture(dbif Dbif) error {
	locales := []string {"en", "ja", "ko", "zh_Hant", "zh_Hans"}
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
	for i := 0; i < 10000; i++ {
		options := proto.Model_Channel_Options {
			Identity: idlvs[rand.Int31n(int32(len(idlvs)))],
			TopicDisplayStyle: dstyles[rand.Int31n(int32(len(dstyles)))],
			AnonymousName: "anon",
			TopicPostLimit: 1000,
		}
		bytes, err := options.Marshal()
		if err != nil {
			return err
		}
		ch := &Channel {
			proto.Model_Channel {
				Id: dbm.UUID(),
				Name: fmt.Sprintf("debug channel %d", (i + 1)), 
				Description: fmt.Sprintf("this is description %d", (i + 1)),
				Style: "",
				Locale:locales[rand.Int31n(int32(len(locales)))],
				Category: uint32(rand.Int31n(int32(len(categories)))),
				Established: proto.UUID(rand.Int63()),
				Options: bytes,
			},
		}
		if err := dbif.Insert(ch); err != nil {
			return err
		}
	}
	return nil
}
