require 'json'
ret = []
ignore = [/Donald/, /Sanders/, /AskReddit/]
File.open(ARGV[0]).each do |l|
# <a href="https://www.reddit.com/r/announcements/" class="choice" >announcements</a>
    l.scan(/<a href=\"[\w]*?:\/\/www.reddit.com\/r\/([\w]+)\/?\"[^>]*?>([^<]+)/) do |_1, _2|
        p "matched:" + _1 + "|" + _2
        idx = _2.index(":")
        _2 = _2[(idx + 1)..-1].strip if idx
        skip = false
        ignore.each do |i|
            if _1 =~ i then
                skip = true
                break
            end
        end
        ret.push([_1, _2, "/r/#{_1} - #{_2}"]) unless skip
    end
end
File.open(ARGV[1], "w") do |f|
    f.write(JSON.pretty_generate(ret));
end
