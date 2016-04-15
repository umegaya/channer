package yue

import (
	"net"
	"bufio"

	"github.com/ugorji/go/codec"
)

//codec interface
type Decoder interface {
	Decode(pl interface{}) error
}

type Encoder interface {
	Encode(pl interface{}) error
}

type DecoderFactory interface {
	NewDecoder(c net.Conn) Decoder
}

type EncoderFactory interface {
	NewEncoder(c net.Conn) Encoder
}

//implementation of DecoderFactory/EncoderFactory, by msgpack.
type BuiltinCodecFactory struct {
	handle *codec.MsgpackHandle
}

func NewBuiltinCodecFactory(cfg func (*codec.MsgpackHandle)) *BuiltinCodecFactory {
	h := &codec.MsgpackHandle{}
	if cfg != nil {
		cfg(h)
	}
	return &BuiltinCodecFactory {
		handle: h,
	}
}

func (cf *BuiltinCodecFactory) NewDecoder(c net.Conn) Decoder {
	return codec.NewDecoder(bufio.NewReader(c), cf.handle)
}

func (cf *BuiltinCodecFactory) NewEncoder(c net.Conn) Encoder {
	return codec.NewEncoder(bufio.NewWriter(c), cf.handle)
}

