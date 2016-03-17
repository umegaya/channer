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
	Name string
	node *Node
	InsertFixture bool
}
type Txn struct {
	*gorp.Transaction
}
type Dbif interface {
	Delete(list ...interface{}) (int64, error)
	Exec(query string, args ...interface{}) (sql.Result, error)
	Get(i interface{}, keys ...interface{}) (interface{}, error)
	Insert(list ...interface{}) error
	Prepare(query string) (*sql.Stmt, error)
	Select(i interface{}, query string, args ...interface{}) ([]interface{}, error)
	SelectFloat(query string, args ...interface{}) (float64, error)
	SelectInt(query string, args ...interface{}) (int64, error)
	SelectNullFloat(query string, args ...interface{}) (sql.NullFloat64, error)
	SelectNullInt(query string, args ...interface{}) (sql.NullInt64, error)
	SelectNullStr(query string, args ...interface{}) (sql.NullString, error)
	SelectOne(holder interface{}, query string, args ...interface{}) error
	SelectStr(query string, args ...interface{}) (string, error)
	Update(list ...interface{}) (int64, error)
	UpdateColumns(filter gorp.ColumnFilter, list ...interface{}) (int64, error)	
}

var dbm Database

func Init(db_addr, certs, host_addr, data_path string, insert_fixture bool) error {
	schema := "http"
	if len(certs) > 0 {
		schema = "https"
	}
	db, err := sql.Open("cockroach", fmt.Sprintf("%s://root@%s:26257?certs=%s", schema, db_addr, certs))
	if err != nil {
		return err
	}
	//setup database
	dbm = Database{
		gorp.DbMap{Db: db, Dialect: gorp.NewCockroachDialect()}, 
		"channer", nil, insert_fixture,
	}
	//add model 
	InitNode()
	InitAccount()
	InitRescue()
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
    dbm.node, _, err = NewNode(&dbm, host_addr)
    if err != nil {
    	log.Printf("NewNode: %v", err)
    	return err
    }
    log.Printf("model initialized")
    //import data
    if err := Import(data_path); err != nil {
    	log.Printf("Import data: %v", err)    	
    	return err
    }
    return nil
}

func DBM() *Database {
	return &dbm
}

func create_table(tmpl interface {}, name string, pkey_column string) *gorp.TableMap {
	return dbm.AddTableWithNameAndSchema(tmpl, dbm.Name, name).SetKeys(false, pkey_column)
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
	return dbm.node.NewUUID()
}

func (dbm *Database) Txn(fn func (Dbif) error) error {
	tx, err := dbm.Begin()
	if err != nil {
		return err
	}
	txn := Txn { tx }
	if err := fn(txn); err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()
	return nil
}
