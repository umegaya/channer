
all: protoc
	go build -o channer

start: all
	curl -O http://localhost:9999/assets/config.json
	./channer -c settings.json -a config.json

protoc: 
	@protoc --gofast_out=./proto -I ../proto ../proto/*.proto
