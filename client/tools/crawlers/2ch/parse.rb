require 'json'
ret = []
File.open(ARGV[0]).each do |l|
#<A HREF=http://hayabusa8.2ch.net/mnewsplus/>芸スポ速報+</A><br>
	l = l.encode("utf-8", "sjis")
    l.scan(/<A HREF=\"?[\w:]*?\/\/[^\/]+\/([\w]+)\/?\"?[^>]*?>([^<]+)/) do |_1, _2|
        p "matched:" + _1 + "|" + _2
        ret.push([_1, _2, "/2/#{_1} - #{_2}"])
    end
end
File.open(ARGV[1], "w") do |f|
    f.write(JSON.pretty_generate(ret));
end
