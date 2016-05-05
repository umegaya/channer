package actors

import (
	"fmt"
)

type HelloActor struct {
	name string
}

func (a *HelloActor) Hello(your_name string) (string, error) {
	if len(your_name) > 0 {
		return fmt.Sprintf("hello, %v! from %s", your_name, a.name), nil
	} else {
		return fmt.Sprintf("hello, anonymous! from %s", a.name), nil	
	}
}

func NewHelloActor(my_name string) (*HelloActor, error) {
	return &HelloActor { name: my_name }, nil
}
