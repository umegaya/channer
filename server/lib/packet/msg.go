package packet

type Msg struct {
	text string			`json:"text"`
	attr interface {}	`json:"attr"`
}

func (m *Msg) Process(t Transport) {
	t.Send(&TopicDestination{
		Topic: "hoge",
	}, &Packet {
		Kind: "Msg",
		Data: m,
	})
}

