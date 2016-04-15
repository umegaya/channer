package yue

import (
	"fmt"
	"log"
	"sync"
	"time"

	proto "./proto"
)


//InmemoryFactory represents factory definition using container as go struct.
type InmemoryFactory struct {
	Constructor func (args ...interface {}) (interface {}, error)
}

//errors 
var ActorNotFound error = fmt.Errorf("actor not found")
var ActorNoSuchMethod error = fmt.Errorf("actor no such method")
var ActorAlreadyHasProcess error = fmt.Errorf("actor already has process")
var ActorProcessAlreadyRemoved error = fmt.Errorf("actor process already removed")

//represents common (internal) actor object
//yue's actor is, like orleans of MS, virtual one. actual message processing is delegate to Process.
type actor struct {
	id string 
	processes []proto.ProcessId
	index int
	limit int 
}

func newactor(id string, conf ActorConfig) *actor {
	return &actor {
		id: id,
		processes: make([]proto.ProcessId, conf.Size),
		index: 0,
		limit: conf.Size,
	}
}

func (a *actor) call(ctx *rpcContext, method string, args ...interface {}) (interface {}, error) {
	r, err := sv().call(ctx, a.balance(), method, args...)
	if err != nil {
		/*
		呼び出し側のエラー処理
		TODO: もし、applicationレベルではないエラーが発生した場合、障害の可能性が高いためシステムレベルでの対応が必要になる.

		### stateless actorの場合 (SpawnOption.Size == 1)
		txかけてロードし直して、そのノードへの失敗をマークし、他のprocessにリクエストを投げる。
		何回か失敗したらtxかけてロードし直して、そのprocessid自体を消す

		### statefull actorの場合 (otherwise)
		master lease的なものが必要。5secに一回とか、現在のactorのオーナーのノードがtimestampを更新する
		他はtxかけてロードし直して状態をチェックする。
		もしtimestampが古すぎる場合には、現在のノードが落ちたとみなし、他のノードで作ったprocessに置き換える
		すでにtxが走っていたら単純にリロードして、leaseの状態やprocess idを再度チェックする

		呼び出された側のエラー処理はProcess.Callの中で行われる
		*/
		if err == ActorNotFound {
			if conf, ok := amgr().findConfig(a.id); ok {
				if conf.Size == 1 {

				} else {

				}
			}
		}
	}
	return r, err
}

func (a *actor) balance() proto.ProcessId {
	idx := a.index
	a.index++
	if a.index >= len(a.processes) {
		a.index = 0
	}
	return a.processes[idx]
}

func (a *actor) addProcess(conf *ActorConfig) (*Process, error) {
	if a.limit <= len(a.processes) {
		return nil, ActorAlreadyHasProcess
	}
	p, err := pmgr().spawn(a, &(conf.SpawnConfig))
	a.processes = append(a.processes, p.Id)
	return p, err
}

func (a *actor) removeProcess(p *Process) error {
	for idx, pid := range a.processes {
		if pid == p.Id {
			if idx > 0 {
				a.processes = append(a.processes[0:idx], a.processes[idx+2:]...)
			} else {
				a.processes = a.processes[1:]
			}
			pmgr().kill(p)
			return nil
		}
	}
	return ActorProcessAlreadyRemoved
}

func (a *actor) from(p *proto.Actor) error {
	pl := proto.ProcessList{}
	if err := pl.Unmarshal(p.Processes); err != nil {
		return err
	}
	a.id = p.Id
	a.limit = int(pl.Limit)
	a.processes = make([]proto.ProcessId, len(pl.List))
	for i, pid := range pl.List {
		a.processes[i] = proto.ProcessId(pid)
	}
	return nil
}

func (a *actor) proto() (*proto.Actor, error) {
	list := proto.ProcessList {
		Limit: uint32(a.limit),
		List: make([]proto.ProcessId, len(a.processes)),
	}
	for i, pid := range a.processes {
		list.List[i] = proto.ProcessId(pid)
	}
	bytes, err := list.Marshal()
	if err != nil {
		return nil, err
	}
	return &proto.Actor {
		Id: a.id,
		Processes: bytes,
	}, nil
}



//SpawnOption represent options for spawn
type ActorConfig struct {
	SpawnConfig SpawnConfig //object which describe how to create 
	Size int		//how many process can join this actor? if == 1, means only 1 process can serve as this actor.
					//if <= 0, means unlimited processes can serve.
	Throttle int 	//only enable when Size != 1.
					//hard limit of request per second(rps). if rps exceed throttle, 
					//and # of processes less than Size, new process will be added. 
					//TODO: should throttle-exceeded actor reject request so that caller try another caller?
}

//represents common (internal) actor manager
type actormgr struct {
	configs map[string]*ActorConfig
	actors map[string]*actor
	restartq chan *Process //restart queue
	cmtx sync.RWMutex
	amtx sync.RWMutex
}

func newactormgr() *actormgr {
	return &actormgr {
		configs: make(map[string]*ActorConfig),
		actors: make(map[string]*actor),
		restartq: make(chan *Process),
		cmtx: sync.RWMutex{},
		amtx: sync.RWMutex{},
	}
}

//start does periodic task to maintain actor store. should run as goroutine
func (am *actormgr) start() {
	ticker := time.NewTicker(1000 * time.Millisecond)
	for {
		select {
		case t := <- ticker.C:
			log.Printf("tick %v", t)
			//TODO: reload each actor's state
		case p := <- am.restartq:
			go func () {
				if err := p.start(); err != nil {
					am.unloadProcess(p)
				}
			}()
		}
	}
}

//loadActor loads actor which has given id.
func (am *actormgr) loadActor(act *actor, dbh dbh) error {
	a := proto.Actor{}
	if err := dbh.SelectOne(&a, "select * from yue.actors where id = $1", act.id); err != nil {
		//TODO: return ActorNotFound when it actually not found.
		return ActorNotFound
	}
	if err := act.from(&a); err != nil {
		return err
	}
	return nil
}

//registerActorConfig registers actor creation setting for given id
func (am *actormgr) registerConfig(id string, conf *ActorConfig, args []interface{}) {
	//avoid modifying original conf, cause it may be reused
	copy := &ActorConfig{}
	*copy = *conf
	copy.SpawnConfig.args = args
	defer am.cmtx.Unlock()
	am.cmtx.Lock()
	am.configs[id] = copy
}

//findSpawnOpts finds actor creation option
func (am *actormgr) findConfig(id string) (*ActorConfig, bool) {
	defer am.cmtx.RUnlock()
	am.cmtx.RLock()
	c, ok := am.configs[id]
	return c, ok
}

//addToCache adds actor object to cache
func (am *actormgr) registerActor(a *actor) {
	defer am.amtx.Unlock()
	am.amtx.Lock()
	am.actors[a.id] = a
}

//findActorObject finds actor from its cache
func (am *actormgr) findActor(id string) (*actor, bool) {
	defer am.amtx.RUnlock()
	am.amtx.RLock()
	a, ok := am.actors[id]
	return a, ok
}


//ensureLoaded ensure actor which has given id and option *opts* loaded.
func (am *actormgr) ensureLoaded(id string) (*actor, error) {
	if a, ok := am.findActor(id); ok {
		return a, nil
	}
	a := &actor{
		id: id,
	}
	if err := db().txn(func (dbh dbh) error {
		conf, ok := am.findConfig(a.id)
		if !ok || conf == nil {
			return ActorNotFound
		}
		err := am.loadActor(a, dbh);
		if err == ActorNotFound {
			//aがない場合、追加でactorを作成する。
			if _, err := a.addProcess(conf); err != nil {
				return err
			} else {
				dbh.Insert(a.proto())
			}
		} else if err != nil {
			//その他のシステムエラー:一旦エラーを返す
			return err
		} else if conf.Size != 1 {
			if conf.Throttle <= 0 {
				a.id = id
				//aがある場合でthrottleが<=0の場合、追加でactorを作成する
				if _, err := a.addProcess(conf); err != nil {
					return err
				}
				if _, err := dbh.Update(a.proto()); err != nil {
					return err
				}
			} //else aがある場合でthrottleが>0の場合、そのまま。どこかのactorがthrottle以上のリクエストを受けたらactorをさらに作成する
		} //else 1つのactorしか許されていない。そのままaを返す
		return nil
	}); err != nil {
		return nil, err
	}
	am.registerActor(a)
	return a, nil
}

func (am *actormgr) unloadProcess(p *Process) error {
	a := p.owner
	return db().txn(func (dbh dbh) error {
		if err := a.removeProcess(p); err != nil {
			return err
		}
		if _, err := dbh.Update(a.proto()); err != nil {
			return err
		}
		return nil
	})
}
