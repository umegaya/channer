package models

import (
	//"log"
	"path/filepath"
	"os"
)

func create_channels(path string) {
	
}

func Import(path string) error {
	return filepath.Walk(path, func (path string, f os.FileInfo, err error) error {
		return nil
	})
}