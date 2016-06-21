/* global __dirname */
var fs = require("fs");
var hashes = require('jshashes');
var webpack = require('webpack');
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
            route: "./src/route.tsx",
            l10n: "./src/l10n",
            category: "./src/category.ts",
        },
        output: {
            path: __root + "/www/assets",
            filename: "[name].[chunkhash].js",
            publicPath: "/assets/",
            assetServerPort: 9999,
        },
        resolve: {
            extensions: ['', '.ts', '.tsx', '.js', '.proto', '.css'],
            modulesDirectories: ["node_modules", "src/proto"],
            alias: {
                protobufjs: __root + "/node_modules/protobufjs/dist/ProtoBuf-light.js",
                Long: __root + "/node_modules/protobufjs/node_modules/bytebuffer/node_modules/long/dist/Long.js",
                long: __root + "/node_modules/protobufjs/node_modules/bytebuffer/node_modules/long/dist/Long.js",
                ByteBuffer: __root + "/node_modules/protobufjs/node_modules/bytebuffer/dist/ByteBufferAB.js",
                bytebuffer: __root + "/node_modules/protobufjs/node_modules/bytebuffer/dist/ByteBufferAB.js",
                "mithril.animate": __root + "/node_modules/mithril.animate/dist/mithril.animate.js",
                "mithril.bindings": __root + "/node_modules/mithril.animate/node_modules/mithril.bindings/dist/mithril.bindings.js",
            }
        },
        node: {
            fs: "empty"
        },
        devtool: 'inline-source-map',
        module: {
            loaders: [
                {test: /\.tsx?$/,     loader: 'awesome-typescript-loader?tsconfig=./tsconfig.json'},
                {test: /\.json$/,   loader: 'raw-loader'},
                {test: /\.css$/,    loader: 'css-loader'},
                {test: /\.styl$/,   loader: 'css-loader!stylus-loader?paths=node_modules/bootstrap-stylus/stylus/'},
                {test: /\.svg$/,    loader: 'url-loader?mimetype=image/svg+xml&limit=10000&name=[hash:6].[ext]' },
                {test: /\.png$/,    loader: 'url-loader?mimetype=image/png&limit=20000&name=[hash:6].[ext]' },
                {test: /\.gif$/,     loader: 'url-loader?mimetype=image/gif&limit=100000&name=[hash:6].[ext]' },
                {test: /\.woff(\?[0-9a-zA-Z]+)?$/, loader: 'url?limit=10000&minetype=application/font-woff'},
                {test: /\.(ttf|eot)(\?[0-9a-zA-Z]+)?$/, loader: 'file'}
            ],
            postLoaders: [
                { loader: "transform?brfs" }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                "process.env": { 
                    NODE_ENV: JSON.stringify("production") 
                }
            }),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.CommonsChunkPlugin("commons", "commons.[chunkhash].js"),
            // Write out stats file to build directory.
            new StatsWriterPlugin({
                filename: "config.json",
                transform: function (data) {
                    //declare simple dependency of each assets
                    //TODO : if it goes really complex, enable graph-style dependency declaration
                    var deps = ["commons", "patch", "vendor", "l10n", "boot", "route", 
                        "category", "channel", "top", "login", "rescue", "topic", "compose"];
                    function sorter(a, b) {
                        return deps.indexOf(a.name) - deps.indexOf(b.name);
                    }
                    console.log(JSON.stringify(data));
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
