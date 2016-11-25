package models

import (
	"log"
	"path/filepath"
	"os"
)

func create_channels(path string) {
	
}

func Import(path string) error {
	dbm := DBM()
	if dbm.InsertFixture {
		log.Printf("insert channels")
		if err := InsertChannelFixture(dbm); err != nil {
			return err
		}
		log.Printf("insert topics")
		if err := InsertTopicFixture(dbm); err != nil {
			return err
		}
		log.Printf("insert reactions")
		if err := InsertReactionFixture(dbm); err != nil {
			return err
		}
		log.Printf("insert posts")
		if err := InsertPostFixture(dbm); err != nil {
			return err
		}
	}
	return filepath.Walk(path, func (path string, f os.FileInfo, err error) error {
		return nil
	})
}
