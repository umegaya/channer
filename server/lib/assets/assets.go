package assets

import (
	"encoding/json"
	"os"
	"io"
	"log"
	"net/http"
)

//client asset config
type App struct {
	ClientVersion string `json:"client_version"`
}
type Config struct {
	App App `json:"appconfig"`
}
func (c *Config) Load(path string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	return c.decode(f);
}
func (c *Config) decode(f io.Reader) error {
	//reinitialize config value
	*c = Config{}
	dec := json.NewDecoder(f)
	if err := dec.Decode(c); err != nil {
		return err
	}
	return nil
}
func (c *Config) Update(url string) error {
	request, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	client := &http.Client{}
	resp, err := client.Do(request)
	if err != nil {
		return err
	}
	log.Printf("update asset config: client version = %v", c.App.ClientVersion);
	return c.decode(resp.Body)
}
