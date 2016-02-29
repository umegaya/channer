all: 
	@gulp watch &
	@phonegap serve --browser
    
stop:
	-@killall gulp
	-@killall node

locale:
	node node_modules/json-locale/json-locale.js --keep=identity --localeFilter=en,ja,ko,zh_Hant,zh_Hans
	
setuptest:
	@gulp webpack-watch &
	@sleep 2
	@make -C ../server restart &
	@phonegap serve --browser 2>&1 > /dev/null &
	@sleep 1

runtest: stop setuptest
	@gulp test
	@make -C ../server stop
	-@killall gulp
	-@killall node
	@echo "test OK"
    
devtest: stop setuptest
	@gulp testdev
	@make -C ../server stop
	-@killall gulp
	-@killall node
	@echo "test OK"

web:
	@docker inspect channerweb 2>&1 > /dev/null || docker run --name channerweb -p 80:80 --net="host" -d -v `pwd`/platforms/browser/www:/usr/local/apache2/htdocs httpd

stopweb:
	-@docker kill channerweb
	@docker rm channerweb

cert:
	bash tools/genkeystore.sh channer.keystore channer
