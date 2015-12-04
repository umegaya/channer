
all: protoc
	go build -o channer

protoc: 
	@protoc --gofast_out=./proto -I ../proto ../proto/*.proto
