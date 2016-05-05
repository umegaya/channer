package main

import (
	"log"

	"github.com/umegaya/channer/server/lib"
)

func main() {
	var c channer.Config
	if err := c.Parse(); err != nil {
		log.Fatal(err)
	}
	channer.NewFrontServer(&c).Run()
}
