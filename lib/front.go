package channer

import (
	"net"
	"net/http"
	"log"

	"./packet"

	"github.com/gorilla/websocket"
)

//FrontServerConn represent one front server connection 
type FrontServerConn struct {
	ws *websocket.Conn 
	send chan *packet.Packet
	//Account Account
}

//newFrontServerConn creates new frontend connection
func newFrontServerConn(ws *websocket.Conn) *FrontServerConn {
	return &FrontServerConn {
		ws: ws,
		send: make(chan *packet.Packet),
	}
}

//write send v as sent payload and 
func (c *FrontServerConn) Write(pkt *packet.Packet) {
	c.send <- pkt
}


//addr returns net.Addr of this FrontServerConn
func (c *FrontServerConn) addr() net.Addr {
	return c.ws.RemoteAddr()
}

//String implements packet.Source interface
func (c *FrontServerConn) String() string {
	return c.addr().String()
}

//writer used as goroutine, receive send message via send channel, write it to 
func (c *FrontServerConn) writer(sv *FrontServer) {
	for pkt := range c.send {
		if err := c.ws.WriteJSON(pkt); err != nil {
			break
		}
	}
	c.ws.Close()
}

//reader used as goroutine, receive client message and notify it to FrontServer object
func (c *FrontServerConn) reader(sv *FrontServer) {
 	for {
 		pkt := &packet.RecvPacket{ From: c }
        if err := c.ws.ReadJSON(pkt); err != nil {
            break
        }
        sv.receive <- pkt
    }
    c.ws.Close()
}

//close closes attached websocket
func (c *FrontServerConn) close() {
	c.ws.Close()
}


//FrontServer represents one server listener context.
type FrontServer struct {
	cmap		map[string]*FrontServerConn
	config 		*Config	
	join 		chan *FrontServerConn
	leave   	chan *FrontServerConn
	receive     chan *packet.RecvPacket
	send   		chan *packet.SendPacket
	closer      chan interface{}
	upgrader 	websocket.Upgrader
}

//NewFront creates new frontend server
func NewFrontServer(config *Config) *FrontServer {
	return &FrontServer {
		cmap : make(map[string]*FrontServerConn),
		config : config,
		join : make(chan *FrontServerConn),
		leave : make(chan *FrontServerConn),
		receive : make(chan *packet.RecvPacket),
		send : make(chan *packet.SendPacket),
		closer : make(chan interface{}),
		upgrader : websocket.Upgrader{ReadBufferSize: 1024, WriteBufferSize: 1024},
	}
}

//ServeHTTP implements http.Handler interface
func (sv *FrontServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ws, err := sv.upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    c := newFrontServerConn(ws)
    sv.join <- c
    defer sv.eject(c)
    go c.writer(sv)
    c.reader(sv)
}

//Run sets up websocket handler, starts listen on configured address
func (sv *FrontServer) Run() {
	http.Handle(sv.config.EndPoint, sv)
	go sv.processEvents()
 	err := http.ListenAndServe(sv.config.ListenAddress, nil)
    if err != nil {
        panic("FrontServer.Run fails to listen: " + err.Error())
    }
}

//Send sends spcified pkt to specified destination to
func (sv *FrontServer) Send(to packet.Destination, pkt *packet.Packet) error {
	sv.send <- &packet.SendPacket{ pkt, to }
	return nil
}

//processEvent processes event to channel
func (sv *FrontServer) processEvents() {
	for {
		select {
		case c := <-sv.join:
			log.Printf("join from %s", c.String())
			sv.cmap[c.addr().String()] = c
		case c := <-sv.leave:
			log.Printf("leave from %s", c.String())
			delete(sv.cmap, c.addr().String())
			c.close()
		case pkt := <-sv.receive:
			log.Printf("receive from client at %s", pkt.From.String())
			pkt.Process(sv)
		case pkt := <-sv.send:
			tmp := &packet.Packet{ Kind: pkt.Kind, Data: pkt.Data }
			for _, c := range sv.cmap {
				c.Write(tmp)
			}
		}
	}
}

//leave leaves target connection
func (sv *FrontServer) eject(c *FrontServerConn) {
	sv.leave <- c
}
