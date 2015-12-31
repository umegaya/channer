package models

import (
	proto "../../proto"
)

//Account represents one user account
type Post struct {
	proto.Model_Post
}

func InitPost() {
	create_table(Post{}, "posts", "Id")
}

