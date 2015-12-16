package models

import (
	"log"
	"fmt"
	"database/sql"

	_ "github.com/cockroachdb/cockroach/sql/driver"
	"github.com/go-gorp/gorp"
)

var dbmap *gorp.DbMap

func Init(addr, certs string) error {
	schema := "http"
	if len(certs) > 0 {
		schema = "https"
	}
	db, err := sql.Open("cockroach", fmt.Sprintf("%s://root@%s:26257?certs=%s&database=channer", schema, addr, certs))
	if err != nil {
		return err
	}
	//setup database
	dbmap = &gorp.DbMap{Db: db, Dialect: NewCockroachDialect()}
	//add model 
	InitAccount()
	InitDevice()
	InitService()
	InitPersona()
	InitChannel()
	InitTopic()
	InitReaction()
	InitPost()
	//create table according to model definition. TODO: how to do migration with roach?
    if err := dbmap.CreateTablesIfNotExists(); err != nil {
    	log.Printf("CreateTablesIfNotExists: %v", err)
    	return err
    }
    log.Printf("model initialized")
    return nil
}

func DBM() *gorp.DbMap {
	return dbmap
}
