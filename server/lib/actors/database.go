package yue

import (
	"database/sql"

	//_ "github.com/cockroachdb/cockroach/sql/driver"
	_ "github.com/cockroachdb/pq"
	//"github.com/go-gorp/gorp"
	"github.com/umegaya/gorp"
)

type Database struct {
	gorp.DbMap
	node *Node
}
type Dbh interface {
	Delete(list ...interface{}) (int64, error)
	Exec(query string, args ...interface{}) (sql.Result, error)
	Insert(list ...interface{}) error
	Prepare(query string) (*sql.Stmt, error)
	Select(i interface{}, query string, args ...interface{}) ([]interface{}, error)
	SelectOne(holder interface{}, query string, args ...interface{}) error
	Update(list ...interface{}) (int64, error)
	UpdateColumns(filter gorp.ColumnFilter, list ...interface{}) (int64, error)	
}
type Txn struct {
	*gorp.Transaction
}

var database Database

func init_database(c Config) error {
	url := fmt.Sprintf("postgresql://root@%s:26257?sslmode=disable", c.DatabaseAddress)
	if len(c.CertsPath) > 0 {
		url = fmt.Sprintf("postgresql://root@%s:26257?sslmode=verify-full&sslcert=%s&sslrootcert=%s&sslkey=%s", c.DatabaseAddress, 
			fmt.Sprint("%s/ca.crt", c.CertsPath), 
			fmt.Sprintf("%s/root.client.crt", c.CertsPath), 
			fmt.Sprintf("%s/ca.key", c.CertsPath))
	}
	db, err := sql.Open("postgres", url)
	if err != nil {
		return err
	}
	//setup database
	database = Database{
		gorp.DbMap{Db: db, Dialect: gorp.NewCockroachDialect()}, 
		"yue", nil, insert_fixture,
	}
	init_node()
	init_actor()
	log.Printf("initialize actor store")
	//create table according to model definition. TODO: how to do migration with roach?
    if err := dbm.CreateTablesIfNotExists(); err != nil {
    	log.Printf("CreateTablesIfNotExists: %v", err)
    	return err
    }
    log.Printf("create actor tables")
    if _, err := dbm.Exec("set database = yue;"); err != nil {
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
    //initialize node object
    database.node, _, err = new_node(&database, c.HostAddress)
    if err != nil {
    	log.Printf("NewNode: %v", err)
    	return err
    }
    log.Printf("init node")
    return nil
}

func db() *Database {
	return &database
}

func store(dbh Dbh, record interface {}, columns []string) (int64, error) {
	return dbh.UpdateColumns(func (col *gorp.ColumnMap) bool {
		for _, c := range columns {
			if col.ColumnName == c {
				return true
			}
		}
		return false
	}, record)
}

func uuid() uint64 {
	return database.node.NewUUID()
}

func (dbm *Database) txn(fn func (Dbh) error) error {
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

func table(tmpl interface {}, name string, pkey_column string) *gorp.TableMap {
	return database.AddTableWithNameAndSchema(tmpl, "yue", name).SetKeys(false, pkey_column)
}

