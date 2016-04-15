package yue

import (
	"io"
	"net"
	"sync"
	"time"
	"container/list"

	proto "./proto"

	"golang.org/x/net/context"
)

//
// context
//
type rpcContext struct {
	peer_id uint32 //node_id + peer connection id (aka serial) 
	deadline time.Time //absolute time to deadline
	txn interface {} //for txn call. all database operation is done in this txn.
	gctx context.Context //go cancel/timeout context. for compatibility to common go rpc implementation
}

//
// Conn
//
type conn struct {
	nid proto.NodeId
	conn net.Conn
	send chan *payload
	recv chan *payload
	rmap map[proto.MsgId]*payload
	tick *time.Ticker
	pool *list.List
	codec string
	mutex sync.Mutex
}

type connConfig struct {
	nodeId proto.NodeId
	codec string
}

type connProcessor interface {
	NewDecoder(string, net.Conn) Decoder
	NewEncoder(string, net.Conn) Encoder
	ProcessRequest(*payload, *conn)
	ProcessNotify(*payload, *conn)
	Exit(*conn)
}

//create Conn
func newconnbase(c net.Conn, cfg connConfig) *conn {
	return &conn {
		nid: cfg.nodeId,
		conn: c,
		send: make(chan *payload),
		recv: make(chan *payload),
		rmap: make(map[proto.MsgId]*payload),
		tick: time.NewTicker(1 * time.Second),
		pool: list.New(),
		codec: cfg.codec,
	}	
}

func newconn(c net.Conn, cfg connConfig) (*conn, error) {
	if cfg.nodeId < 0 {
		var err error
		nid, err := NodeIdByAddr(c.RemoteAddr().String())
		if err != nil {
			return nil, err
		}
		cfg.nodeId = nid
	}
	return newconnbase(c, cfg), nil
}

func newlocalconn(c net.Conn, cfg connConfig) *conn {
	return newconnbase(c, cfg)
}

//TODO: following 2 function should be evaluated again. (mutex lock cost <> malloc cost for channel)
//now I assume mutex lock has greater cost.

//newch returns empty channel for receiving rpc result
func (c *conn) newch() chan *payload {
/*	defer c.mutex.Unlock()
	c.mutex.Lock()
	if c.pool.Len() > 0 {
		return c.pool.Remove(c.pool.Front).(chan *Payload)
	} */
	return make(chan *payload)
}

//pushch receives channel which finishes to use, and cache it for next use.
func (c *conn) pushch(ch chan *payload) {
/*	defer c.mutex.Unlock()
	c.mutex.Lock() 
	c.pool.PushFront(ch) */
}

func (c *conn) addr() net.Addr {
	return c.conn.RemoteAddr()
}

func (c *conn) close() {
	c.conn.Close()
}

//do rpc. should call in goroutine
func (c *conn) request(ctx *rpcContext, msgid proto.MsgId, pid proto.ProcessId, method string, args []interface{}) (interface {}, error) {
	ch := c.newch()
	c.send <- buildRequest(ctx, msgid, pid, method, args, ch)
	select {
	case resp := <- ch:
		c.pushch(ch)
		err := resp.error()
		if err != nil {
			return nil, err
		}
		return resp.args(), nil
	case <- ctx.gctx.Done():
		return nil, ctx.gctx.Err()
	}
}

//do rpc but do not receive response
func (c *conn) notify(pid proto.ProcessId, method string, args []interface{}) error {
	c.send <- buildNotify(pid, method, args)
	return nil
}

//used internally to send response of rpc
func (c *conn) reply(msgid proto.MsgId, args interface{}) error {
	slice, ok := args.([]interface{})
	if ok {
		c.send <- buildResponse(msgid, nil, slice)
	} else {
		c.send <- buildResponse(msgid, nil, []interface{}{args})
	}
	return nil
}

//used internally to send error of rpc
func (c *conn) raise(msgid proto.MsgId, err error) error {
	c.send <- buildResponse(msgid, err, nil)
	return nil
}

//process response
func (c *conn) processResponse(pl *payload) {
	msgid := pl.msgid()
	if p, ok := c.rmap[msgid]; ok {
		delete(c.rmap, msgid)
		p.receiver() <- pl
	}
}

//main loop for each connection handling
func (c *conn) run(p connProcessor) {
    defer p.Exit(c)
    go c.writer(p)
    c.reader(p)
}

//writer used as goroutine, receive send message via send channel, write it to 
func (c *conn) writer(p connProcessor) {
	wr := p.NewEncoder(c.codec, c.conn)
	for {
		select {
		case pl := <- c.send:
			c.rmap[pl.msgid()] = pl
			//TODO: pack context arg and send to remote
			if err := wr.Encode(pl.requestParams()); err != nil {
				goto EXIT
			}
		case pl := <- c.recv:
			c.processResponse(pl)
		case t := <- c.tick.C:
			for msgid, p := range c.rmap {
				ctx := p.ctx()
				if ctx.deadline.UnixNano() <= 0 {
					if tmp, ok := ctx.gctx.Deadline(); ok {
						ctx.deadline = tmp
					} else {
						ctx.deadline = time.Now().Add(5 * time.Second) //default timeout: 5 sec
					}
				}
				if ctx.deadline.UnixNano() < t.UnixNano() {
					//timed out.
					delete(c.rmap, msgid)
					p.receiver() <- buildResponse(msgid, context.Canceled, nil)
				}
			}
		}
	}
EXIT:
}

//reader used as goroutine, receive client message and notify it to FrontServer object
func (c *conn) reader(p connProcessor) {
	rd := p.NewDecoder(c.codec, c.conn)
 	for {
 		var pl payload
 		if err := rd.Decode(&pl); err != nil {
 			if err != io.ErrShortBuffer {
 				break
 			} //ErrShortBuffer means payload received on half way. (maybe...)
 		} else {
			switch (pl.kind()) {
			case REQUEST:
				go p.ProcessRequest(&pl, c)
			case RESPONSE:
				c.recv <- &pl
			case NOTIFY:
				go p.ProcessNotify(&pl, c)
			}
		}
    }
}
