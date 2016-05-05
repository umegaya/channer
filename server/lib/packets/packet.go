package packets

import (
	"log"
	"fmt"

	"github.com/umegaya/channer/server/lib/assets"
	"github.com/umegaya/channer/server/lib/models"
	proto "github.com/umegaya/channer/server/proto"
)

//Source is interface which is required packet source information 
type Source interface {
	String() string
	Send(*proto.Payload)
	Account() *models.Account
	SetAccount(*models.Account)
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
		if pkt.Payload.PostRequest != nil {
			go ProcessPost(pkt.From, pkt.Payload.Msgid, pkt.Payload.PostRequest, t)
		}
	},
	proto.Payload_PingRequest: func (pkt *RecvPacket, t Transport) {
		if pkt.Payload.PingRequest != nil {
			go ProcessPing(pkt.From, pkt.Payload.Msgid, pkt.Payload.PingRequest, t)
		}
	},
	proto.Payload_LoginRequest: func (pkt *RecvPacket, t Transport) {
		if pkt.Payload.LoginRequest != nil {
			go ProcessLogin(pkt.From, pkt.Payload.Msgid, pkt.Payload.LoginRequest, t)
		}
	},
	proto.Payload_RescueRequest: func (pkt *RecvPacket, t Transport) {
		if pkt.Payload.RescueRequest != nil {
			go ProcessRescue(pkt.From, pkt.Payload.Msgid, pkt.Payload.RescueRequest, t)
		}
	},
	proto.Payload_ChannelCreateRequest: func (pkt *RecvPacket, t Transport) {
		if pkt.Payload.ChannelCreateRequest != nil {
			go ProcessChannelCreate(pkt.From, pkt.Payload.Msgid, pkt.Payload.ChannelCreateRequest, t)
		}
	},
	proto.Payload_ChannelListRequest: func (pkt *RecvPacket, t Transport) {
		if pkt.Payload.ChannelListRequest != nil {
			go ProcessChannelList(pkt.From, pkt.Payload.Msgid, pkt.Payload.ChannelListRequest, t)
		}
	},
}

//Init initializes packet processing system
var assetsConfig *assets.Config;
func Init(config *assets.Config) {
	assetsConfig = config;
	log.Printf("asset config: client version = %v", assetsConfig.App.ClientVersion);
}

//AssetSettings returns client assetsettings
func AssetsConfig() *assets.Config {
	return assetsConfig;
}

//Process processes packet according to its type
func (pkt *RecvPacket) Process(t Transport) {
	if handler, ok := handlers[pkt.Payload.Type]; ok {
		handler(pkt, t);
	}
}

//SendError sents error with specified reason
func SendError(src Source, msgid uint32, reason proto.Error_Type) {
	log.Printf("SendError:%v", reason);
	typ := proto.Payload_Error
	src.Send(&proto.Payload {
		Type: typ,
		Msgid: msgid,
		Error: &proto.Error {
			Type: reason,
		},
	})
}

//TopicDestination is destination which specifies topic. packet send to
//all participant of the topic
type TopicDestination struct {
	TopicId proto.UUID
}

//String implements Destination intarface
func (td *TopicDestination) String() string {
	return fmt.Sprintf("%u", td.TopicId);
}
