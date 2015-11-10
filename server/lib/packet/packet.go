package packet

//packet represent one protocol record
type Packet struct {
	Kind string			`json:"kind"`
	Data interface{}	`json:"data"`
}

//Source is interface which is required packet source information 
type Source interface {
	String() string
}

//Destination is interface which is required packet destination information
type Destination interface {
	String() string
}

//Transport is interface which is required packet transport 
type Transport interface {
	Send(Destination, *Packet) error
}

//packet represent one protocol record with receiver information
type RecvPacket struct {
	*Packet
	From Source
}

//packet represent one protocol record with destination information
type SendPacket struct {
	*Packet
	To Destination
}

//handlers map actual packet handler and packet type
var handlers = map[string]func (pkt *Packet, t Transport) {
	"msg": func (pkt *Packet, t Transport) {
		pkt.Data.(*Msg).Process(t)
	},
}

//Process processes packet according to its type
func (pkt *Packet) Process(t Transport) {
	handlers[pkt.Kind](pkt, t)
}


//TopicDestination is destination which specifies topic. packet send to
//all participant of the topic
type TopicDestination struct {
	Topic string
}

//String implements Destination intarface
func (d *TopicDestination) String() string {
	return d.Topic
}
