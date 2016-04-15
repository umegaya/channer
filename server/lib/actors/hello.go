package actors

import (
	"fmt"

	"../../yue"
)

type HelloActor struct {
	name string
}

func NewHelloActor(args ...interface{}) (yue.InmemoryExecuterEntry, error) {
	my_name, ok := args[0].(string)
	if !ok {
		my_name = "no-name"
	}
	ha := &HelloActor { name: my_name }
	return yue.InmemoryExecuterEntry(map[string]func(...interface{}) (interface{}, error) {
		"Hello": func (args ...interface{}) (interface{}, error) {
			your_name, ok := args[0].(string)
			if ok {
				return fmt.Sprintf("hello, %v! from %s", your_name, ha.name), nil
			} else {
				return fmt.Sprintf("hello, no-name! from %s", ha.name), nil	
			}
		},
	}), nil
}
