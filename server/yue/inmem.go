package yue

import (
	"log"
)

//
// inmemoryExecuter
//
//Executer interface implemented by go. it lived in same process as which runs yue
type inmemoryExecuter struct {
	instance InmemoryExecuterEntry
}

type InmemoryExecuterEntry map[string]func(...interface{}) (interface{}, error)

func (im inmemoryExecuter) Call(method string, args ...interface{}) (interface {}, error) {
	if m, ok := im.instance[method]; ok {
		return m(args...)
	}
	return nil, ActorNoSuchMethod
}

//
// InmemoryExecuterFactory
//
type InmemoryExecuterFactory struct {
	Constructor func (...interface{}) (InmemoryExecuterEntry, error)
}

func (im InmemoryExecuterFactory) Create(pid uint64, args ...interface{}) (Executer, error) {
	p, err := im.Constructor(args...)
	if err != nil {
		return nil, err
	}
	return &inmemoryExecuter {
		instance: p,
	}, nil
}

func (im InmemoryExecuterFactory) Destroy(p Executer) {
	if p, ok := p.(inmemoryExecuter); ok {
		if m, ok := p.instance["destroy"]; ok {
			m()
		}
	} else {
		log.Fatalf("invalid executer passed: %v", p)
	}

}

