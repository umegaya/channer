
all: protoc
	go build -o channer

start: all db
	@curl -s -O http://0.0.0.0:9999/assets/config.json 2>&1 > /dev/null
	./channer -c settings.json -a config.json --devdb `cat dbhost`

protoc: 
	@protoc --gogofaster_out=./proto -I ../proto -I `echo $$GOPATH`/src -I `echo $$GOPATH`/src/github.com/gogo/protobuf/protobuf ../proto/*.proto

db: 
	@docker inspect channerdb 2>&1 > /dev/null || docker run --name channerdb -d --net=host -p 26257 cockroachdb/cockroach shell -c "./cockroach start --dev --addr 0.0.0.0:26257"
	@docker-machine ip `docker-machine active` > dbhost

stopdb:
	-@docker kill channerdb
	@docker rm channerdb

browsedb:
	@docker exec -ti channerdb /cockroach/cockroach sql --dev
