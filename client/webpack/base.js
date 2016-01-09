/* global __dirname */
var fs = require("fs");
var hashes = require('jshashes');
var StatsWriterPlugin = require("webpack-stats-plugin").StatsWriterPlugin;
var __root = __dirname + "/..";
module.exports = function (settings) {
    return {
        context: __root,
        contentBase: "./www",
        entry: {
            vendor: "./src/vendor.ts",
            patch: "./src/patch.ts",
            boot: "./src/boot.ts",
            channel: "./src/components/channel.ts",
            main: "./src/components/main.ts",
            login: "./src/components/login.ts",
            topic: "./src/components/topic.ts",
            rescue: "./src/components/rescue.ts",
            compose: "./src/components/compose.ts",
        },
        output: {
            path: __root + "/www/assets",
            filename: "[name].[chunkhash].js",
            publicPath: "/assets/",
            assetServerPort: 9999,
        },
        resolve: {
            extensions: ['', '.ts', '.js', '.proto', '.css'],
            modulesDirectories: ["node_modules", "src/proto"],
            alias: {
                protobufjs: __root + "/node_modules/protobufjs/dist/ProtoBuf-light.js",
                Long: __root + "/node_modules/protobufjs/node_modules/bytebuffer/node_modules/long/dist/Long.js",
                long: __root + "/node_modules/protobufjs/node_modules/bytebuffer/node_modules/long/dist/Long.js",
                ByteBuffer: __root + "/node_modules/protobufjs/node_modules/bytebuffer/dist/ByteBufferAB.js",
                bytebuffer: __root + "/node_modules/protobufjs/node_modules/bytebuffer/dist/ByteBufferAB.js",
            }
        },
        node: {
            fs: "empty"
        },
        devtool: 'inline-source-map',
        module: {
            loaders: [
                {test: /\.ts$/,     loader: 'awesome-typescript-loader?tsconfig=./tsconfig.json'},
                {test: /\.json$/,   loader: 'raw-loader'},
                {test: /\.css$/,    loader: 'css-loader'},
                {test: /\.styl$/,   loader: 'css-loader!stylus-loader?paths=node_modules/bootstrap-stylus/stylus/'},
                {test: /\.(png|gif|jpe?g)$/, loader: 'file-loader'},
                {test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url?limit=10000&minetype=application/font-woff'},
                {test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file'}
            ]
        },
        plugins: [
            // Write out stats file to build directory.
            new StatsWriterPlugin({
                filename: "config.json",
                transform: function (data) {
                    //declare simple dependency of each assets
                    //TODO : if it goes really complex, enable graph-style dependency declaration
                    var deps = ["vendor", "boot", "channel", "main", "login", "rescue", "topic", "compose"];
                    function sorter(a, b) {
                        return deps.indexOf(a.name) - deps.indexOf(b.name);
                    }
                    var hash_src = "";
                    var ret = { versions: [], appconfig: false };
                    for (var k in data.assetsByChunkName) {
                        //console.log("k = " + data.assetsByChunkName[k]);
                        var hash = data.assetsByChunkName[k].match(/.+?\.([^\.]+)\.([^\.]+)$/);
                        if (hash) {
                            //console.log("hash = " + hash[1] + "|" + hash[2]);
                            ret.versions.push({name: k, hash: hash[1], ext: hash[2]});
                            hash_src += hash[1];
                        }
                    }
                    ret.versions.sort(sorter);
                    ret.appconfig = settings.appconfig;
                    ret.appconfig.client_version = (new hashes.SHA256()).b64(hash_src);
                    return JSON.stringify(ret, null, 2);
                }
            })
        ]
    }
}
