package packet

import (
	"fmt"

	proto "../../proto"
)

//Source is interface which is required packet source information 
type Source interface {
	String() string
	Send(*proto.Payload)
}

//Destination is interface which is required packet destination information
type Destination interface {
	String() string
}

//Transport is interface which is required packet transport 
type Transport interface {
	Send(Destination, *proto.Payload) error
}

//packet represent one protocol record with receiver information
type RecvPacket struct {
	Payload *proto.Payload
	From Source
}

//packet represent one protocol record with destination information
type SendPacket struct {
	Payload *proto.Payload
	To Destination
}

//handlers map actual packet handler and packet type
var handlers = map[proto.Payload_Type]func (pkt *RecvPacket, t Transport) {
	proto.Payload_PostRequest: func (pkt *RecvPacket, t Transport) {
		go ProcessPost(pkt.From, *pkt.Payload.Msgid, pkt.Payload.PostRequest, t)
	},
	proto.Payload_PingRequest: func (pkt *RecvPacket, t Transport) {
		//go Process(pkt.From, pkt.Payload.PingRequest, t)
		go ProcessPing(pkt.From, *pkt.Payload.Msgid, pkt.Payload.PingRequest, t)
	},
	proto.Payload_LoginRequest: func (pkt *RecvPacket, t Transport) {
		//go Process(pkt.From, pkt.Payload.PingRequest, t)
		go ProcessLogin(pkt.From, *pkt.Payload.Msgid, pkt.Payload.LoginRequest, t)
	},
}

//Process processes packet according to its type
func (pkt *RecvPacket) Process(t Transport) {
	handler, ok := handlers[*pkt.Payload.Type]
	if ok {
		handler(pkt, t);
	}
}

//TopicDestination is destination which specifies topic. packet send to
//all participant of the topic
type TopicDestination struct {
	TopicId uint64
}

//String implements Destination intarface
func (td *TopicDestination) String() string {
	return fmt.Sprintf("%u", td.TopicId);
}
