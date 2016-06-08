package models

import (
	proto "github.com/umegaya/channer/server/proto"
)

//Account represents one user account
type Post struct {
	proto.Model_Post
}

func InitPost() {
	create_table(Post{}, "posts", "Id")
}

