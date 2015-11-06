package channer

import (
	"encoding/json"
	"os"
	"flag"
)

//Config represents common configuration of channer servers
type Config struct {
	EndPoint        string      `json:"endpoint"`
	ListenAddress   string      `json:"listen"`
}

//check_and_fill check configuration, if configuration seems not set, 
//it aborts or set default value
func (c *Config) check_and_fill() error {
	if c.EndPoint == "" {
		c.EndPoint = "/ws"
	}
	if c.ListenAddress == "" {
		c.ListenAddress = "0.0.0.0:8888"
	}
	return nil
}

//Parse() pareses comannd line argument, and store it to newly created Config object, and return it.
func (c *Config) Parse() error {
	s := flag.String("c", "", "configuration file for channer server")
	flag.Parse()
	return c.Load(*s)
}
func (c *Config) Load(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	//reinitialize config value
	*c = Config{}
	dec := json.NewDecoder(f)
	if err := dec.Decode(c); err != nil {
		return err
	}
	if err := c.check_and_fill(); err != nil {
		return err
	}
	return nil
}

