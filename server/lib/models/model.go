package models

import (
	"log"
	"fmt"
	"database/sql"

	proto "../../proto"

	_ "github.com/cockroachdb/cockroach/sql/driver"
	"github.com/umegaya/gorp"
)

type Database struct {
	gorp.DbMap
	node *Node
}

var dbm Database

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
	dbm = Database{gorp.DbMap{Db: db, Dialect: gorp.NewCockroachDialect()}, nil}
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
    if err := dbm.CreateTablesIfNotExists(); err != nil {
    	log.Printf("CreateTablesIfNotExists: %v", err)
    	return err
    }
    //initialize node object
    dbm.node, _, err = NewNode(host_addr)
    if err != nil {
    	log.Printf("NewNode: %v", err)
    	return err
    }
    log.Printf("model initialized")
    return nil
}

func DBM() *Database {
	return &dbm
}

func create_table(tmpl interface {}, name string, pkey_column string) *gorp.TableMap {
	return dbm.AddTableWithName(tmpl, name).SetKeys(false, pkey_column)
}

func (dbm *Database) StoreColumns(record interface {}, columns []string) (int64, error) {
	return dbm.UpdateColumns(func (col *gorp.ColumnMap) bool {
		for _, c := range columns {
			if col.ColumnName == c {
				return true
			}
		}
		return false
	}, record)
}

func (dbm *Database) UUID() proto.UUID {
	//var uuid UUID
	//err := DBM().Db.QueryRow("select experimental_unique_int()").Scan(&uuid)
	//return uuid, err
	return dbm.node.NewUUID()
}
