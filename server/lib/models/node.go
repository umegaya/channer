package models

import (
	"log"
	"time"
	"sync"

	proto "../../proto"
)

//Account represents one user account
type Node struct {
	proto.Model_Node
	mutex sync.Mutex `db:"-"`
}

func InitNode() {
	create_table(Node{}, "nodes", "Id").AddIndex("addr", "UNIQUE", []string{"Address"})
}

func insertWithId(address string) (*Node, error) {
	var node *Node
	if err := dbm.Txn(func (tx Dbif) error {
RETRY:
		var max_id uint64
		if err := tx.SelectOne(&max_id, dbm.Stmt("select max(Id)+1 from %s.nodes")); err != nil {
			log.Printf("select max(id) fails: %v", err)
			max_id = 1
		}
		if max_id > 0x7FFF {
			log.Fatalf("node entry reach to limit: %v", max_id)
		}
		node = &Node {
			proto.Model_Node {
				Id: proto.UUID(max_id),
				Address: address,
			},
			sync.Mutex{},
		}
		if err := tx.Insert(node); err != nil {
			goto RETRY
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return node, nil
}

func NewNode(dbif Dbif, address string) (*Node, bool, error) {
	node := &Node{}
	if err := dbif.SelectOne(node, dbm.Stmt("select * from %s.nodes where address = $1"), address); err != nil {
		node, err := insertWithId(address)
		if err != nil {
			return nil, false, err
		}
		return node, true, nil
	}
	return node, false, nil
}

var uniqueIDEpoch = time.Date(2015, time.January, 1, 0, 0, 0, 0, time.UTC).UnixNano()

func (n *Node) NewUUID() proto.UUID {
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
	return proto.UUID(id)

}

func (n *Node) Proto() proto.Model_Node {
	return n.Model_Node
}
