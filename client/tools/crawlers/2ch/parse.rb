require 'json'
ret = []
def recode_windows_1252_to_utf8(string)
  string.gsub(/[\u0080-\u009F]/) {|x| x.getbyte(1).chr.
    force_encoding('windows-1252').encode('utf-8') }
end
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
