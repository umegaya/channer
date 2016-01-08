all: 
	@gulp webpack-watch &
	@phonegap serve --browser
    
stop:
	-@killall gulp
	-@killall node

runtest: stop
	@gulp webpack-watch &
	@sleep 2
	@make -C ../server restart &
	@phonegap serve --browser 2>&1 > /dev/null &
	@sleep 1
	@gulp test
	@make -C ../server stop
	-@killall gulp
	-@killall node
	@echo "test OK"

web:
	@docker inspect channerweb 2>&1 > /dev/null || docker run --name channerweb -p 80:80 --net="host" -d -v `pwd`/platforms/browser/www:/usr/local/apache2/htdocs httpd

stopweb:
	-@docker kill channerweb
	@docker rm channerweb
