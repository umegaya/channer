package models

import (
	"reflect"

	"github.com/go-gorp/gorp"
)

type CockroachDialect struct {
	gorp.PostgresDialect
}

func (d CockroachDialect) ToSqlType(val reflect.Type, maxsize int, isAutoIncr bool) string {
	switch val.Kind() {
	case reflect.Ptr:
		return d.ToSqlType(val.Elem(), maxsize, isAutoIncr)
	case reflect.Bool:
		return "boolean"
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32:
		if isAutoIncr {
			return "bigint"
		}
		return "bigint"
	case reflect.Int64, reflect.Uint64:
		if isAutoIncr {
			return "bigint"
		}
		return "bigint"
	case reflect.Float64:
		return "float"
	case reflect.Float32:
		return "float"
	case reflect.Slice:
		if val.Elem().Kind() == reflect.Uint8 {
			return "bytes"
		}
	}

	switch val.Name() {
	case "NullInt64":
		return "bigint"
	case "NullFloat64":
		return "float"
	case "NullBool":
		return "boolean"
	case "Time", "NullTime":
		return "timestamp"
	}

	return "text"
}

func NewCockroachDialect() CockroachDialect {
	return CockroachDialect{gorp.PostgresDialect{}}
}