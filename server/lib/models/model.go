package models

import (
	"log"
	"fmt"
	"strings"
	"database/sql"

	proto "github.com/umegaya/channer/server/proto"
	"github.com/umegaya/channer/server/lib/utils"

	_ "github.com/cockroachdb/pq"
	"github.com/umegaya/gorp"
	"github.com/umegaya/yue"
)

type Database struct {
	gorp.DbMap
	Name string
	InsertFixture bool
}
type Txn struct {
	*gorp.Transaction
}
type Dbif interface {
	gorp.SqlExecutor
	UpdateColumns(filter gorp.ColumnFilter, list ...interface{}) (int64, error)
}

var dbm Database

func Init(db_addr, certs, host_addr, data_path string, insert_fixture bool) error {
	url := fmt.Sprintf("postgresql://root@%s:26257?sslmode=disable", db_addr)
	if len(certs) > 0 {
		url = fmt.Sprintf("postgresql://root@%s:26257?sslmode=verify-full&sslcert=%s&sslrootcert=%s&sslkey=%s", db_addr, 
			fmt.Sprint("%s/ca.crt", certs), 
			fmt.Sprintf("%s/root.client.crt", certs), 
			fmt.Sprintf("%s/ca.key", certs))
	}
	db, err := sql.Open("postgres", url)
	if err != nil {
		return err
	}
	//setup database
	dbm = Database{
		gorp.DbMap{Db: db, Dialect: gorp.NewCockroachDialect()}, 
		"channer", insert_fixture,
	}
	//add model 
	InitAccount()
	InitRescue()
	InitDevice()
	InitService()
	InitPersona()
	InitChannel()
	InitTopic()
	InitReaction()
	InitPost()
	log.Printf("initialize db")
	//create table according to model definition. TODO: how to do migration with roach?
    if err := dbm.CreateTablesIfNotExists(); err != nil {
    	log.Printf("CreateTablesIfNotExists: %v", err)
    	return err
    }
    log.Printf("create databases")
    if _, err := dbm.Exec("set database = channer;"); err != nil {
    	log.Printf("exec set database: %v", err)
    	return err;
    }
    if err := dbm.CreateIndex(); err != nil {
    	if strings.Contains(err.Error(), "duplicate index name") {
    		log.Printf("index already created: ignore error %v", err)
    	} else {
	    	log.Printf("CreateIndex: %v", err)
    		return err    	
    	}
    }
    log.Printf("create indexes")
    //import data
    if err := Import(data_path); err != nil {
    	log.Printf("Import data: %v", err)    	
    	return err
    }
    log.Printf("model initialized")
	utils.DumpMemUsage()
    return nil
}

func DBM() *Database {
	return &dbm
}

func create_table(tmpl interface {}, name string, pkey_column ...string) *gorp.TableMap {
	return dbm.AddTableWithNameAndSchema(tmpl, dbm.Name, name).SetKeys(false, pkey_column...)
}

func StoreColumns(dbif Dbif, record interface {}, columns []string) (int64, error) {
	return dbif.UpdateColumns(func (col *gorp.ColumnMap) bool {
		for _, c := range columns {
			if col.ColumnName == c {
				return true
			}
		}
		return false
	}, record)
}

func (dbm *Database) Stmt(stmt string, args ...interface{}) string {
	if len(args) > 0 {
		_args := []interface{} { dbm.Name }
		_args = append(_args, args...)
		log.Printf("sql: %v", fmt.Sprintf(stmt, _args...))
		return fmt.Sprintf(stmt, _args...)
	}
	return fmt.Sprintf(stmt, dbm.Name)
}

func (dbm *Database) UUID() proto.UUID {
	//var uuid UUID
	//err := DBM().Db.QueryRow("select experimental_unique_int()").Scan(&uuid)
	//return uuid, err
	return proto.UUID(yue.NewId())
}

func (dbm *Database) Txn(fn func (Dbif) error) error {
	tx, err := dbm.Begin()
	if err != nil {
		return err
	}
	txn := &Txn{ tx }
	if err := fn(txn); err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()
	return nil
}
