package yue

import (
	proto "./proto"
)


//
// payload
//
const (
	REQUEST = iota	//kind, msgid, pid, args
	RESPONSE		//kind, msgid, err, args
	NOTIFY 			//kind, pid, args

	TXN = 0x4
)

const (
	KIND = 0
	
	REQUEST_MSGID = 1
	REQUEST_PID = 2
	REQUEST_METHOD = 3
	REQUEST_ARGS = 4
	REQUEST_CTX = 5
	REQUEST_RECEIVER = 6

	RESPONSE_MSGID = 1
	RESPONSE_ERROR = 2
	RESPONSE_ARGS = 3
	
	NOTIFY_PID = 1
	NOTIFY_METHOD = 2
	NOTIFY_ARGS = 3
)

type payload []interface{}

func (pl payload) kind() uint8 {
	return pl[KIND].(uint8) & 0x3
}

func (pl payload) msgid() proto.MsgId {
	switch (pl.kind()) {
	case REQUEST:
		return pl[REQUEST_MSGID].(proto.MsgId)
	case RESPONSE:
		return pl[RESPONSE_MSGID].(proto.MsgId)
	default:
		return 0
	}
}

func (pl payload) pid() proto.ProcessId {
	switch (pl.kind()) {
	case REQUEST:
		return pl[REQUEST_PID].(proto.ProcessId)
	case NOTIFY:
		return pl[NOTIFY_PID].(proto.ProcessId)
	default:
		return 0
	}
}

func (pl payload) method() string {
	switch (pl.kind()) {
	case REQUEST:
		return pl[REQUEST_METHOD].(string)
	case NOTIFY:
		return pl[NOTIFY_METHOD].(string)
	default:
		return ""
	}	
}

func (pl payload) error() error {
	switch (pl.kind()) {
	case RESPONSE:
		return pl[RESPONSE_ERROR].(error)
	default:
		return nil
	}
}

func (pl payload) args() []interface{} {
	switch (pl.kind()) {
	case REQUEST:
		return pl[REQUEST_ARGS].([]interface{})
	case RESPONSE:
		return pl[RESPONSE_ARGS].([]interface{})
	case NOTIFY:
		return pl[NOTIFY_ARGS].([]interface{})
	default:
		return nil
	}
}

func (pl payload) ctx() *rpcContext {
	switch (pl.kind()) {
	case REQUEST:
		return pl[REQUEST_CTX].(*rpcContext)
	default:
		return nil
	}	
}

func (pl payload) receiver() chan *payload {
	switch (pl.kind()) {
	case REQUEST:
		return pl[REQUEST_RECEIVER].(chan *payload)
	default:
		return nil
	}	
}

func (pl payload) requestParams() []interface{} {
	return (([]interface{})(pl))[KIND:REQUEST_ARGS]
}

func buildRequest(ctx *rpcContext, msgid proto.MsgId, pid proto.ProcessId, method string, args []interface {}, ch chan *payload) *payload {
	r := make([]interface{}, 7)
	p := payload(append(r, REQUEST, msgid, pid, method, args, ctx, ch))
	return &p
}

func buildResponse(msgid proto.MsgId, err error, args []interface {}) *payload {
	r := make([]interface{}, 4)
	p := payload(append(r, RESPONSE, msgid, err, args))
	return &p
}

func buildNotify(pid proto.ProcessId, method string, args []interface {}) *payload {
	r := make([]interface{}, 4)
	p := payload(append(r, NOTIFY, pid, method, args))
	return &p
}
