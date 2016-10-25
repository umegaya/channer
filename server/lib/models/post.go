package models

import (
	"os"
	"log"
	"fmt"
	"bytes"
	"math/rand"
	"encoding/json"
	"strings"
	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Post struct {
	proto.Model_Post
}

func InitPost() {
	create_table(Post{}, "posts", "Id")
}

const POST_FETCH_LIMIT = 50

func NewPost(dbif Dbif, a *Account, req *proto.PostCreateRequest) (*Post, error) {
	var (
		p *Persona
		err error
	)
	if p, err = a.Persona(dbif, req.Topic); err != nil {
		return nil, &proto.Err{ Type: proto.Error_PostCreate_NoPersonaError }
	}
	body := proto.Model_Post_Body {
		Name: p.Name,
	}
	bs, err := body.Marshal()
	if err != nil {
		return nil, &proto.Err{ Type: proto.Error_PostCreate_DatabaseError }
	}
	tp := &Post {
		proto.Model_Post {
			Id: dbm.UUID(),
			Topic: req.Topic, 
			Persona: p.Id,
			Content: req.Content,
			Body: bs,
		},
	}
	if err = dbif.Insert(tp); err != nil {
		return nil, &proto.Err{ Type: proto.Error_PostCreate_DatabaseError }
	}
	return tp, nil
}

func ListPost(dbif Dbif, req *proto.PostListRequest) ([]*proto.Model_Post, error) {
	var limit int32
	if req.Limit > 0 {
		limit = req.Limit
		if limit > POST_FETCH_LIMIT {
			limit = POST_FETCH_LIMIT
		}
	} else {
		limit = POST_FETCH_LIMIT
	}
	cond := ""
	tmp := []string{fmt.Sprintf("topic = %v", req.Topic)}
	order_by := "id desc"
	if req.Query == proto.PostListRequest_New {
		if req.OffsetId != nil {
			tmp = append(tmp, fmt.Sprintf("id < %v", *req.OffsetId))
		}
	} else if req.Query == proto.PostListRequest_Popular {
		if req.OffsetId != nil {
			tmp = append(tmp, fmt.Sprintf("point < %v", *req.OffsetId))
		}
	}
	if len(tmp) > 0 {
		cond = "where " + strings.Join(tmp, " AND ")
	}
	//TODO: how to handle "popular" query type?
	ps, err := dbif.Select(Post{}, dbm.Stmt(`select * from %s.posts %s order by %s limit %d`, cond, order_by, limit))
	if err != nil {
		return nil, err
	}
	ret := make([]*proto.Model_Post, len(ps))
	for i, p := range ps {
		pp := p.(*Post).Model_Post
		ret[i] = &pp
	}
	return ret, nil
}



//fixture
type PostInfo struct {
	Id proto.UUID
}

func InsertPostFixture(dbif Dbif) error {
	locales := Locales()
	var count uint64
	var file *os.File
	var comments []string
	if err := dbif.SelectOne(&count, dbm.Stmt("select count(*) from %s.posts")); err != nil {
		return err
	}
	if count > 0 {
		log.Printf("post fixture already inserted: %v", count)
		return nil
	}
	topics, err := dbif.Select(PostInfo{}, dbm.Stmt(`select id from %s.topics order by id desc limit 10`))
	if err != nil {
		return err
	}
	
	if file, err = os.Open("./data/comments.json"); err != nil {
		return err
	}
	dec := json.NewDecoder(file)
	if err = dec.Decode(&comments); err != nil {
		return err
	}

	user_ids := make([]proto.UUID, 500)
	for i := 0; i < 500; i++ {
		user_ids[i] = dbm.UUID()
	}

	for i := 0; i < 3; i++ {
		for j := 0; j < 100; j++ {
			var buffer bytes.Buffer
		    buffer.WriteString(dbm.Stmt("insert into %s.posts values"))
			sep := ""
			for k := 0; k < 10; k++ {
				user_id := user_ids[rand.Int31n(int32(len(user_ids)))]
				ti := topics[rand.Int31n(int32(len(topics)))].(*PostInfo)
				body := proto.Model_Post_Body {
					Reactions: []*proto.Model_Post_Body_Reaction{
						{uint64(rand.Int63n(3) + 1), uint64(rand.Int63n(5) + 1)}, 
						{uint64(rand.Int63n(3) + 1), uint64(rand.Int63n(5) + 1)}},
					Name: fmt.Sprintf("user-%v", user_id),
				}
				bs, err := body.Marshal()
				if err != nil {
					return err
				}
				id := ti.Id
				uv, dv := rand.Int31n(25), rand.Int31n(25)
				//cstr := []string{ "$$", comments[i * 1000 + j * 10 + k], "$$" }
				buffer.WriteString(fmt.Sprintf("%s(%v,%v,%v,'%s',0,%v,%v,%s,%s)", 
					sep, dbm.UUID(), id, user_id, locales[rand.Int31n(int32(len(locales)))],
					uv - dv, uint32(uv + dv), stringColumnEncode(comments[i * 1000 + j * 10 + k]), 
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
	}
	return nil
}
