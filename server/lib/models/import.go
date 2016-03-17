package models

import (
	//"log"
	"path/filepath"
	"os"
)

func create_channels(path string) {
	
}

func Import(path string) error {
	dbm := DBM()
	if dbm.InsertFixture {
		if err := InsertChannelFixture(dbm); err != nil {
			return err
		}
	}
	return filepath.Walk(path, func (path string, f os.FileInfo, err error) error {
		return nil
	})
}
