var fs = require("fs");
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
            org: "./src/components/org.ts",
            main: "./src/components/main.ts",
            login: "./src/components/login.ts",
            topic: "./src/components/topic.ts",
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
                {test: /\.ts$/, loader: 'awesome-typescript-loader?tsconfig=./tsconfig.json'},
                {test: /\.proto\.json$/, loader: 'raw-loader'},
                {test: /\.png$/, loader: 'url?mimetype=image/png'},
                {test: /\.gif$/, loader: 'url?mimetype=image/gif'},
                {test: /\.jpe?g$/, loader: 'url?mimetype=image/jpeg'},
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
                    var deps = ["vendor", "boot", "org", "main", "login", "topic", "compose"];
                    function sorter(a, b) {
                        return deps.indexOf(a.name) - deps.indexOf(b.name);
                    }
                    var ret = { versions: [], appconfig: false };
                    for (var k in data.assetsByChunkName) {
                        var hash = data.assetsByChunkName[k].match(/.+?\.([^\.]+)\.js$/);
                        if (hash) {
                            ret.versions.push({name: k, hash: hash[1]});
                        }
                    }
                    ret.versions.sort(sorter);
                    ret.appconfig = settings.appconfig;
                    return JSON.stringify(ret, null, 2);
                }
            })
        ]
    }
}
