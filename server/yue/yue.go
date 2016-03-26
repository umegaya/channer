package yue

import (
	"fmt"
	"net"

	proto "./proto"

	"golang.org/x/net/context"
)

//configuration of actor system
type Config struct {
	Listeners []net.Listener
	DatabaseAddress string
	CertPath string
	HostAddress string
	DefaultApiVersion string
}

type UUID proto.UUID

//module global vars
var _server *server = newserver()
var _actormgr *actormgr = newactormgr()
var _database *database = newdatabase()
var _dockerctrl *dockerctrl = newdockerctrl()
var _processmgr *processmgr = newprocessmgr()

func sv() *server {
	return _server
}

func amgr() *actormgr {
	return _actormgr
}

func db() *database {
	return _database
}

func uuid() uint64 {
	return _database.node.newUUID()
}

func node() *Node {
	return _database.node
}

func dc() *dockerctrl {
	return _dockerctrl
}

func pmgr() *processmgr {
	return _processmgr
}



//API
func Init(c Config) error {
	if err := _database.init(c); err != nil {
		return err
	}
	if err := _dockerctrl.init(c); err != nil {
		return err
	}
	if len(c.Listeners) > 0 {
		//TODO: implement generic frontend for actor RPC call
		//so that client can interact with actors transparently.
		return fmt.Errorf("generic actor server is not implemented... yet!")
	}
	//start main listener. TODO: be configurable
	go _actormgr.start()
	go _server.listen("tcp", ":8008")
	return nil
}

//spawn setup initialization table of given id. 
//its lazy evaluated. thus, actor object is initialized only when someone does RPC of corresponding id.
func Register(id string, conf ActorConfig, args ...interface{}) {
	_actormgr.registerConfig(id, &conf, args)
}

//send speocified RPC to given id's actor. should call in some goroutine
func Call(id, method string, args ...interface{}) (interface{}, error) {
	return GCall(context.Background(), id, method, args...)
}

//same as Call but can receive go's context.
func GCall(ctx context.Context, id, method string, args ...interface{}) (interface{}, error) {
	//ensure actor which is corresponding to id, is loaded.
	a, err := _actormgr.ensureLoaded(id)
	if err != nil {
		return nil, err
	}
	return a.call(&rpcContext {
		gctx: ctx,
	}, method, args...)
}

//generate 64bit new uuid by using yue generate id facility.
//only after Init is called, it returns valid value.
func NewId() UUID {
	return UUID(uuid())
}
