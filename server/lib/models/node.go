package models

import (
	"log"
	"time"
	"sync"
)

//Account represents one user account
type Node struct {
	Id uint16
	Address string
	Seed uint64
	mutex sync.Mutex `db:"-"`
}

func InitNode() {
	create_table(Node{}, "nodes", "Id").AddIndex("addr", "INDEX", []string{"Address"})
}

func insertWithId(address string) (*Node, error) {
RETRY:
	tx, err := DBM().Begin()
	if err != nil {
		return nil, err
	}
	var max_id uint16
	if err := tx.SelectOne(&max_id, "select max(id) from nodes"); err != nil {
		log.Printf("select max(id) fails: %v", err)
		max_id = 1
	}
	node := &Node {
		Id: max_id,
		Address: address,
	}
	if err := tx.Insert(node); err != nil {
		tx.Rollback()
		goto RETRY
	}
	tx.Commit()
	return node, nil
}

func NewNode(address string) (*Node, bool, error) {
	node := &Node{}
	if err := DBM().SelectOne(node, "select * from nodes where address = $1", address); err != nil {
		node, err := insertWithId(address)
		if err != nil {
			return nil, false, err
		}
		return node, true, nil
	}
	return node, false, nil
}

var uniqueIDEpoch = time.Date(2015, time.January, 1, 0, 0, 0, 0, time.UTC).UnixNano()

func (n *Node) NewUUID() UUID {
	const precision = uint64(10 * time.Microsecond)
	const nodeIDBits = 15

	id := uint64(time.Now().UnixNano()-uniqueIDEpoch) / precision

	n.mutex.Lock()
	if id <= n.Seed {
		id = n.Seed + 1
	}
	n.Seed = id
	n.mutex.Unlock()
	
	id = (id << nodeIDBits) | uint64(n.Id)
	return UUID(id)

}