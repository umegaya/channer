package channer

import (
	"net"
	"net/http"
	"log"
	"time"

	proto "github.com/umegaya/channer/server/proto"
	"github.com/umegaya/channer/server/lib/packets"
	"github.com/umegaya/channer/server/lib/assets"
	"github.com/umegaya/channer/server/lib/models"
	"github.com/umegaya/channer/server/lib/actors"

	"github.com/umegaya/yue"
	"github.com/gorilla/websocket"
)

//FrontServerConn represents one front server connection 
type FrontServerConn struct {
	ws *websocket.Conn 
	send chan *proto.Payload
	account *models.Account
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

//Send implements packets.Source interface
func (c *FrontServerConn) Send(payload *proto.Payload) {
	c.Write(payload)
}

//addr returns net.Addr of this FrontServerConn
func (c *FrontServerConn) addr() net.Addr {
	return c.ws.RemoteAddr()
}

//String implements packets.Source interface
func (c *FrontServerConn) String() string {
	return c.addr().String()
}

//Account implements packets.Source interface
func (c *FrontServerConn) Account() *models.Account {
	return c.account
}

//SetAccount implements packets.Source interface
func (c *FrontServerConn) SetAccount(a *models.Account) {
	c.account = a
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
        sv.receive <- &packets.RecvPacket{ Payload: &payload, From: c }
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
	receive     chan *packets.RecvPacket
	send   		chan *packets.SendPacket
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
	return &FrontServer {
		cmap : make(map[string]*FrontServerConn),
		config : config,
		join : make(chan *FrontServerConn),
		leave : make(chan *FrontServerConn),
		receive : make(chan *packets.RecvPacket),
		send : make(chan *packets.SendPacket),
		closer : make(chan interface{}),
		upgrader : websocket.Upgrader{ReadBufferSize: 1024, WriteBufferSize: 1024, CheckOrigin: co},
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

func (sv *FrontServer) initActors() error {
	config := sv.config
	//initialize actor system
	if err := yue.Init(&yue.Config {
		DatabaseAddress: config.DBHost,
		CertPath: config.DBCertPath,
		HostAddress: config.NodeIpv4Address,
	}); err != nil {
		return err
	}
	yue.Register("/hello", yue.ActorConfig {
		SpawnConfig: yue.SpawnConfig {
			Factory: yue.InmemoryExecuterFactory {
				Constructor: actors.NewHelloActor,
			},
		},
		Size: 1,
	}, "channer")
	go func() {
		var r string
		if err := yue.Call("/hello", "Hello", "actor-caller", &r); err != nil {
			log.Fatalf("err should not happen: %v %v", err)
		} else if r != "hello, actor-caller! from channer" {
			log.Fatalf("unexpected response: %v", r)
		}
	}()
	return nil
}

//init initialize related modules 
func (sv *FrontServer) init() {
	config := sv.config
	//initialize packet processor
	a := assets.Config {}
	if err := a.Load(config.AssetsConfigPath); err != nil {
		log.Fatal(err)
	}
	packets.Init(&a);
	//initialize actor system
	if err := sv.initActors(); err != nil {
		log.Fatal(err)
	}
	//initialize models
	if err := models.Init(
			config.DBHost, config.DBCertPath, 
			config.NodeIpv4Address, config.DataPath, 
			config.InsertFixture); err != nil {
		log.Fatal(err)
	}
	sv.assets = &a	
}

//Run sets up websocket handler, starts listen on configured address
func (sv *FrontServer) Run() {
	sv.init()
	http.Handle(sv.config.EndPoint, sv)
	go sv.processEvents()
    go sv.updateAssetsConfig(sv.config.AssetsConfigURL)
    if sv.config.CertPath == "" {
		if err := http.ListenAndServe(sv.config.ListenAddress, nil); err != nil {
        	panic("FrontServer.Run fails to listen: " + err.Error())
    	}
    } else {
 		if err := http.ListenAndServeTLS(sv.config.ListenAddress, sv.config.CertPath, sv.config.KeyPath, nil); err != nil {
        	panic("FrontServer.Run fails to listen: " + err.Error())
    	}
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
func (sv *FrontServer) Send(dest packets.Destination, payload *proto.Payload) error {
	sv.send <- &packets.SendPacket{ To: dest, Payload: payload }
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
func (sv *FrontServer) sendlist(to packets.Destination) map[string]*FrontServerConn {
	return sv.cmap
}

//eject leaves target connection
func (sv *FrontServer) eject(c *FrontServerConn) {
	sv.leave <- c
}
