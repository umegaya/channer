ROOT=$(dirname $0)/../tools/crawlers
OUT=$(dirname $0)/../../server/data

function 2ch {
	curl http://menu.2ch.net/bbsmenu.html > $ROOT/2ch/source.txt
	ruby $ROOT/2ch/parse.rb $ROOT/2ch/source.txt $OUT/2ch.json
}

function 4chan {
	# TODO: how to get source.txt?
	#curl http://menu.2ch.net/bbsmenu.html > $ROOT/2ch/source.txt
	ruby $ROOT/4chan/parse.rb $ROOT/4chan/source.txt $OUT/4chan.json
}

function reddit {
	curl https://www.reddit.com/subreddits/ > $ROOT/reddit/source.txt
	ruby $ROOT/reddit/parse.rb $ROOT/reddit/source.txt $OUT/reddit.json
}

$1
