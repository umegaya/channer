package packet

type Msg struct {
	text string
	attr interface {}
}

func (m *Msg) Process(t Transport) {
	t.Send(&TopicDestination{
		Topic: "hoge",
	}, &Packet {
		Kind: "msg",
		Data: m,
	})
}

