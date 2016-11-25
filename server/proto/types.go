package ChannerProto

import (
	"github.com/umegaya/yue"
)

type UUID yue.UUID
type Err Error

func (e *Err) Error() string {
	return e.Explanation
}
