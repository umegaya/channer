all: 
	@gulp watch &
	@phonegap serve --browser

web:
	@docker inspect channerweb 2>&1 > /dev/null || docker run --name channerweb -p 80:80 --net="host" -d -v `pwd`/platforms/browser/www:/usr/local/apache2/htdocs httpd

stopweb:
	-@docker kill channerweb
	@docker rm channerweb

