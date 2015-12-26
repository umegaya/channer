package models

import (
	"log"
	"fmt"
	"database/sql"

	_ "github.com/cockroachdb/cockroach/sql/driver"
	"github.com/umegaya/gorp"
)

var dbmap *gorp.DbMap
var node *Node
type UUID uint64

func Init(db_addr, certs, host_addr string) error {
	schema := "http"
	if len(certs) > 0 {
		schema = "https"
	}
	db, err := sql.Open("cockroach", fmt.Sprintf("%s://root@%s:26257?certs=%s", schema, db_addr, certs))
	if err != nil {
		return err
	}
	//setup database
	if _, err := db.Exec("CREATE DATABASE IF NOT EXISTS channer; SET DATABASE = 'channer';"); err != nil {
		return err
	}
	dbmap = &gorp.DbMap{Db: db, Dialect: gorp.NewCockroachDialect()}
	//add model 
	InitNode()
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
    //initialize node object
    node, _, err = NewNode(host_addr)
    if err != nil {
    	log.Printf("NewNode: %v", err)
    	return err
    }
    log.Printf("model initialized")
    return nil
}

func DBM() *gorp.DbMap {
	return dbmap
}

func default_filter(col *gorp.ColumnMap) bool {
	return col.ColumnName != "Id"
}

func update_record(record interface {}) (int64, error) {
	return DBM().UpdateColumns(default_filter, record)
}

func ConfigTable(tmpl interface {}, name string, pkey_column string) *gorp.TableMap {
	return DBM().AddTableWithName(tmpl, name).SetKeys(false, pkey_column)
}

func genUUID() UUID {
	//var uuid UUID
	//err := DBM().Db.QueryRow("select experimental_unique_int()").Scan(&uuid)
	//return uuid, err
	return node.NewUUID()
}
