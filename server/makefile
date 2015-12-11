
all: protoc
	go build -o channer

start: all
	./channer -c settings.json

protoc: 
	@protoc --gofast_out=./proto -I ../proto ../proto/*.proto
