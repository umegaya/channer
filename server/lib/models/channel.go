package models

import (
	"fmt"
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

const CHANNEL_FETCH_LIMIT = 10

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
	if req.Category > 0 {
		tmp = append(tmp, fmt.Sprintf("category = %d", req.Category))
	}
	if len(req.Locale) > 0 {
		tmp = append(tmp, fmt.Sprintf("locale = '%s'", req.Locale))
	}
	if len(tmp) > 0 {
		cond = "where " + strings.Join(tmp, " AND ")
	}
	//TODO: how to handle "popular" query type?
	chs, err := dbif.Select(Channel{}, dbm.Stmt("select * from %s.channels %s order by id desc limit $1", cond), limit)
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
