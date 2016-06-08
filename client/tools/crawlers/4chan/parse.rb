require 'json'
ret = []
File.open(ARGV[0]).each do |l|
# <li><a href="//boards.4chan.org/a/" target="main" title="Anime & Manga">Anime & Manga</a></li>
    l.scan(/<a href=\"[\w:]*?\/\/boards.4chan.org\/([\w]+)\/?\".*?title=\"(.+?)\"/) do |_1, _2|
        p "matched:" + _1 + "|" + _2
        ret.push([_1, _2, "/4/#{_1} - #{_2}"])
    end
end
File.open(ARGV[1], "w") do |f|
    f.write(JSON.pretty_generate(ret));
end