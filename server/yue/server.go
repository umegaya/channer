package yue

import (
	"log"
	"fmt"
	"net"
	"sync"
	"sync/atomic"
	"time"

	proto "./proto"

	"github.com/ugorji/go/codec"
)

//
// server
//
type server struct {
	cmap map[proto.NodeId]*conn
	join chan *conn
	leave chan *conn
	seed int32
	extset map[string]func(codec.Handle)
	config Config
	mutex sync.RWMutex
}

//NewServer creates new server instance
func newserver() *server {
	return &server {
		cmap: make(map[proto.NodeId]*conn),
		join: make(chan *conn),
		leave: make(chan *conn),
		seed: 0,
		extset: make(map[string]func(codec.Handle)),
		mutex: sync.RWMutex{},
	}
}

//run runs server event loop
func (sv *server) listen(cfg Config) {
	go sv.process()
	var (
		c net.Conn
		conn *conn
		err error
		l net.Listener
	)
	sv.config = cfg
	l, err = net.Listen(cfg.MeshServerNetwork, fmt.Sprintf(":%u", cfg.MeshServerPort))
	if err != nil {
		log.Fatal(err)
	}
	defer l.Close()
	for {
		// Wait for a connection.
		c, err = l.Accept()
		if err != nil {
			log.Fatal(err)
		}
		conn, err = newconn(c, connConfig{})
		if err != nil {
			c.Close()
			continue
		}
		sv.join <- conn
	}
}

//Call do rpc to specified process
func (sv *server) call(ctx *rpcContext, pid proto.ProcessId, method string, args ...interface {}) (interface {}, error) {
	c, err := sv.find(pid)
	if err != nil {
		return nil, err
	}
	return c.request(ctx, sv.msgid(), pid, method, args)
}

//notify do rpc to specified process, but never receive result
func (sv *server) notify(pid proto.ProcessId, method string, args ...interface{}) error {
	c, err := sv.find(pid)
	if err != nil {
		return err
	}
	c.notify(pid, method, args)	
	return nil
}

//processEvent processes event to channel
func (sv *server) process() {
	for {
		select {
		case c := <-sv.join:
			log.Printf("connect %s", c.addr().String())
			sv.mutex.Lock()
			sv.cmap[c.nid] = c
			sv.mutex.Unlock()
			go c.run(sv)
		case c := <-sv.leave:
			log.Printf("close %s", c.addr().String())
			sv.mutex.Lock()
			delete(sv.cmap, c.nid)
			sv.mutex.Unlock()
			c.close()
		}
	}
}

//MsgId generates new msgid
func (sv *server) msgid() proto.MsgId {
	if atomic.CompareAndSwapInt32(&sv.seed, 20 * 1000 * 1000, 1) {
		return proto.MsgId(1)
	} else {
		return proto.MsgId(atomic.AddInt32(&sv.seed, 1))
	}
}

//Find finds or creates connection for pid
func (sv *server) find(pid proto.ProcessId) (*conn, error){
	var (
		addr string
		err error
		ok bool
		conn *conn
		c net.Conn
	)
	nid := NodeIdByPid(pid)
	conn, ok = sv.connByNodeId(nid)
	if ok {
		return conn, nil
	}
	addr, err = AddrByNodeId(nid)
	if err != nil {
		return nil, err
	}
	c, err = net.Dial(sv.config.MeshServerNetwork, fmt.Sprintf("%s:%u", addr, sv.config.MeshServerPort))
	if err != nil {
		return nil, err
	}
	conn, err = newconn(c, connConfig{
		nodeId: nid,
		codec: sv.config.MeshServerCodec,
	})
	if err != nil {
		c.Close()
		return nil, err
	}
	sv.join <- conn
	return conn, nil
}

//connByNodeId get conn from node_id
func (sv *server) connByNodeId(node_id proto.NodeId) (*conn, bool) {
	defer sv.mutex.RUnlock()
	sv.mutex.RLock()
	c, ok := sv.cmap[node_id]
	return c, ok
}

//process request. implements connProcessor interface
func (sv *server) ProcessRequest(pl *payload, c *conn) {
	waitms := 10 //10ms
RETRY:
	if p, ok := pmgr().find(pl.pid()); ok {
		rep, err, restart := p.call(pl.method(), pl.args()...)
		if restart {
			waitms = waitms * 2
			if waitms > 1000 {
				waitms = 1000
			}
			time.Sleep(time.Duration(waitms) * time.Millisecond)
			goto RETRY
		} else if err != nil {
			c.raise(pl.msgid(), err)
		} else {
			c.reply(pl.msgid(), rep)
		}
	} else {
		c.raise(pl.msgid(), ActorNotFound)
	}
}

//process notify. implements connProcessor interface
func (sv *server) ProcessNotify(pl *payload, c *conn) {
	waitms := 10 //10ms
RETRY:
	if p, ok := pmgr().find(pl.pid()); ok {
		_, _, restart := p.call(pl.method(), pl.args()...)
		if restart {
			waitms = waitms * 2
			if waitms > 1000 {
				waitms = 1000
			}
			time.Sleep(time.Duration(waitms) * time.Millisecond)
			goto RETRY
		}
	}
}

//connection closed. implements connProcessor interface
func (sv *server) Exit(c *conn) {
	sv.leave <- c
}

//create encoder for specified codec. implements connProcessor interface
func (sv *server) NewDecoder(codec string, c net.Conn) Decoder {
	decf, ok := sv.config.Decoders[codec]
	if !ok {
		log.Panicf("No such decoder %s", codec)
	}
	return decf.NewDecoder(c)
}

//create decoder for specified codec. implements connProcessor interface
func (sv *server) NewEncoder(codec string, c net.Conn) Encoder {
	encf, ok := sv.config.Encoders[codec]
	if !ok {
		log.Panicf("No such decoder %s", codec)
	}
	return encf.NewEncoder(c)
}
