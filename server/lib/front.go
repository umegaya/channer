package channer

import (
	"net"
	"net/http"
	"log"
	"time"

	proto "../proto"
	"./packet"
	"./assets"
	"./models"

	"github.com/gorilla/websocket"
)

//FrontServerConn represents one front server connection 
type FrontServerConn struct {
	ws *websocket.Conn 
	send chan *proto.Payload
	//Account Account
}

//newFrontServerConn creates new frontend connection
func newFrontServerConn(ws *websocket.Conn) *FrontServerConn {
	return &FrontServerConn {
		ws: ws,
		send: make(chan *proto.Payload),
	}
}

//write send v as sent payload and 
func (c *FrontServerConn) Write(payload *proto.Payload) {
	c.send <- payload
}

//Send implements packet.Source interface
func (c *FrontServerConn) Send(payload *proto.Payload) {
	c.Write(payload)
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
	for payload := range c.send {
		if bytes, err := payload.Marshal(); err == nil {
			if err := c.ws.WriteMessage(websocket.BinaryMessage, bytes); err != nil {
				break
			}
		} else {
			break
		}
	}
	c.ws.Close()
}

//reader used as goroutine, receive client message and notify it to FrontServer object
func (c *FrontServerConn) reader(sv *FrontServer) {
 	for {
 		_, bytes, err := c.ws.ReadMessage();
        if err != nil {
            break
        }
        var payload proto.Payload
        if err := payload.Unmarshal(bytes); err != nil {
        	break
        }
        sv.receive <- &packet.RecvPacket{ Payload: &payload, From: c }
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
	assets   	*assets.Config
}

//NewFront creates new frontend server
func NewFrontServer(config *Config) *FrontServer {
	var co func(r *http.Request) bool = nil
	if config.DisableOriginCheck {
		co = func (r *http.Request) bool {
			return true
		}
	}
	//initialize packet processor
	a := assets.Config {}
	if err := a.Load(config.AssetsConfigPath); err != nil {
		log.Fatal(err)
	}
	packet.Init(&a);
	//initialize models
	log.Printf("ad %v", config.NodeIpv4Address)
	if err := models.Init(config.DBHost, config.DBCertPath, config.NodeIpv4Address); err != nil {
		log.Fatal(err)
	}
	return &FrontServer {
		cmap : make(map[string]*FrontServerConn),
		config : config,
		join : make(chan *FrontServerConn),
		leave : make(chan *FrontServerConn),
		receive : make(chan *packet.RecvPacket),
		send : make(chan *packet.SendPacket),
		closer : make(chan interface{}),
		upgrader : websocket.Upgrader{ReadBufferSize: 1024, WriteBufferSize: 1024, CheckOrigin: co},
		assets: &a,
	}
}

//ServeHTTP implements http.Handler interface
func (sv *FrontServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Printf("ServeHTTP")
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
    go sv.updateAssetsConfig(sv.config.AssetsConfigURL)
 	if err := http.ListenAndServeTLS(sv.config.ListenAddress, sv.config.CertPath, sv.config.KeyPath, nil); err != nil {
        panic("FrontServer.Run fails to listen: " + err.Error())
    }
}

//updateAssetsConfig updates assets config from local webpack dev server. this function is assumed to use with go routine.
func (sv *FrontServer) updateAssetsConfig(host string) {
	ticker := time.NewTicker(1000 * time.Millisecond)
    for {
        select {
        case <-ticker.C:
			if err := sv.assets.Update(host); err != nil {
				log.Printf("asset config update fail with %v", err);
			}
        }
    }	
}

//Send sends spcified pkt to specified destination to
func (sv *FrontServer) Send(dest packet.Destination, payload *proto.Payload) error {
	sv.send <- &packet.SendPacket{ To: dest, Payload: payload }
	return nil
}

//processEvent processes event to channel
func (sv *FrontServer) processEvents() {
	for {
		select {
		case c := <-sv.join:
			log.Printf("join from %s", c.String())
			sv.cmap[c.String()] = c
		case c := <-sv.leave:
			log.Printf("leave from %s", c.String())
			delete(sv.cmap, c.String())
			c.close()
		case pkt := <-sv.receive:
			log.Printf("receive from client at %s", pkt.From.String())
			pkt.Process(sv)
		case pkt := <-sv.send:
			//TODO: get sending list from pkt.To. (including inter-server)
			for _, c := range sv.sendlist(pkt.To) {
				c.Write(pkt.Payload)
			}
		}
	}
}

//sendlist makes sendlist from Destination data of packet
func (sv *FrontServer) sendlist(to packet.Destination) map[string]*FrontServerConn {
	return sv.cmap
}

//eject leaves target connection
func (sv *FrontServer) eject(c *FrontServerConn) {
	sv.leave <- c
}
