package models

import (
	proto "../../proto"
)

//Account represents one user account
type Channel struct {
	proto.Model_Channel
}

func InitChannel() {
	create_table(Channel{}, "channels", "Id").AddIndex("established", "INDEX", []string{"Established"})
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
	//TODO: respect category parameter of req.
	chs, err := dbif.Select(Channel{}, dbm.Stmt("select * from %s.channels order by id desc limit $1"), limit)
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
