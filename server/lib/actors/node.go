package yue

import (
	proto "./proto"
)

//Account represents one user account
type Node struct {
	proto.Node
	mutex sync.Mutex `db:"-"`
}

func init_node() {
	table(Node{}, "nodes", "Id").AddIndex("addr", "UNIQUE", []string{"Address"})
}

func insert_node(address string) (*Node, error) {
	var node *Node
	if err := db().txn(func (tx Dbh) error {
RETRY:
		var max_id uint64
		if err := tx.SelectOne(&max_id, dbm.Stmt("select max(Id)+1 from %s.nodes")); err != nil {
			log.Printf("select max(id) fails: %v", err)
			max_id = 1
		}
		if max_id > 0x7FFF {
			return fmt.Errorf("node entry reach to limit: %v", max_id)
		}
		node = &Node {
			proto.Node {
				Id: proto.UUID(max_id),
				Address: address,
			},
			sync.Mutex{},
		}
		id := node.NewUUID() //initialize seed
		log.Printf("initial seed: %v", id)
		if err := tx.Insert(node); err != nil {
			goto RETRY
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return node, nil
}

func new_node(dbif Dbif, address string) (*Node, bool, error) {
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

func (n *Node) NewUUID() uint64 {
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
	return id

}

func (n *Node) Proto() proto.Model_Node {
	return n.Model_Node
}
