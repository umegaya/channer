package models

import (
	"time"
	"sync"
	"bytes"
	"encoding/binary"
	"encoding/base64"
)

//twitter's snowflake like uuid genrator
type UUIDFactory struct {
	mtx sync.Mutex
	address uint32 //32bit
	epoc_millis uint64 //64bit
	dur uint64 //42bit (sec timestamp 32 + msec 1000 < 1024 = 10 bit)
	seed uint32  //22bit
};

const UUID_KEY_SIZE = 12
type UUID_ []byte;

const MAX_SEED = (1 << 22)

func NewUUIDFactory(address uint32, epoc_millis uint64) UUIDFactory {
	return UUIDFactory {
		mtx: sync.Mutex{},
		address: address, 
		epoc_millis: epoc_millis,
		seed: 0,
	}
}

func (f *UUIDFactory) Create() UUID_ {
	defer f.mtx.Unlock()
	f.mtx.Lock()
RETRY:
	millis := uint64(time.Now().UnixNano() / int64(time.Millisecond))
	dur := millis - f.epoc_millis
	if f.dur < dur {
		f.dur = dur
		f.seed = 0
	} else if f.seed < MAX_SEED {
		f.seed++
	} else {
		time.Sleep(1 * time.Millisecond)
		goto RETRY
	}
	buf := new(bytes.Buffer)
	binary.Write(buf, binary.LittleEndian, uint32(millis / 1000))
	binary.Write(buf, binary.LittleEndian, (uint32(millis % 1000) << 22) + f.seed)
	binary.Write(buf, binary.LittleEndian, f.address)
	return buf.Bytes()
}

func (u UUID_) String() string {
	return base64.StdEncoding.EncodeToString(u)
}

func NewUUIDFromString(s string) (UUID_, error) {
	return base64.StdEncoding.DecodeString(s)
}