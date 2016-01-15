/* global __dirname */
/* global process */
var gulp = require('gulp');
var exec = require('gulp-exec');
var rename = require('gulp-rename');
var util = require('gulp-util');
var webpack = require('webpack');
var WebpackDevServer = require("webpack-dev-server");
var nightwatch = require('nightwatch');

var prod = !!util.env.prod;
var webpackConfig = Object.create(require('./webpack/' + (prod ? 'prod.js' : 'dev.js')));

//
// defs, helpers
//

var paths = {
    proto: '../proto',
    proto_json: './src/proto',
    proto_tsd: './typings',
}

var execOptions = {
    pipeStdout: true // default = false, true means stdout is written to file.contents
};

var execReportOptions = {
    stdout: false // default = true, false means don't write stdout
};

//
// gulp tasks
//

// generate JSON files for proto files. 
gulp.task('proto-json', function () {
    var gopath = process.env.GOPATH
    var incpath = "-p "+gopath+"/src -p "+gopath+"/src/github.com/gogo/protobuf/protobuf"
    return gulp
        .src(paths.proto + '/**/*.proto', {base: paths.proto})
        .pipe(exec('pbjs <%= file.path %> --source proto --target json ' + incpath, execOptions))
        .pipe(exec.reporter(execReportOptions))
        .pipe(rename(function (path) {
            path.extname += '.json';
        }))
        .pipe(gulp.dest(paths.proto_json));
});

// generate Typescript definitions for Protocol Buffers messages
gulp.task('proto-tsd', ['proto-json'], function () {
    return gulp
        .src(paths.proto_json + '/**/*.proto.json', {base: paths.proto_json})
        .pipe(exec('proto2typescript --file <%= file.path %> --camelCaseGetSet --properties', execOptions))
        .pipe(exec.reporter(execReportOptions))
        .pipe(rename({extname: ".d.ts"}))
        .pipe(gulp.dest(paths.proto_tsd));
});

//compile assets once by using webpack
gulp.task('webpack', ['webpack-clean'], function() {
  webpack(webpackConfig, function(err, stats) {
    if (err) throw new util.PluginError('webpack:build', err);

    util.log('webpack-build', stats.toString({
      colors: true,
      reasons: true
    }));
  });
});

gulp.task('webpack-clean', function () {
    return gulp.src(webpackConfig.output.path + "/*.js")
        .pipe(exec('rm <%= file.path %>'))
});

// start webpack watcher (caution: this will not write resulting js to your output directory)
gulp.task("webpack-watch", function() {
    // Start a webpack-dev-server
    var server = "0.0.0.0";
    var port = webpackConfig.output.assetServerPort;
    var compiler = webpack(webpackConfig);

    new WebpackDevServer(compiler, {
      noInfo: true,
      hot: true,
      contentBase: webpackConfig.contentBase,
      publicPath: webpackConfig.output.publicPath,
      stats: {
        colors: true,
        reasons: true
      }
    }).listen(port, server, function(err) {
        if(err) throw new util.PluginError("webpack:serve", err);
        // Server listening
        util.log("Starting", util.colors.blue("Webpack Development Server"));
        util.log("Listening", util.colors.magenta("http://"+server+":"+port));
    });
});

// run test
gulp.task('test', function () {
    nightwatch.runner({
        config: 'nightwatch.json',
        group: 'specs',
        env: 'chrome'
    }, function (passed) {
        process.exit(passed ? 0 : 1);
    });
});

gulp.task('testdev', function () {
    nightwatch.runner({
        config: 'nightwatch.json',
        group: 'lab',
        env: 'chrome'
    }, function (passed) {
        process.exit(passed ? 0 : 1);
    });
});

// watch files
gulp.task('watch', ['webpack-watch'], function() {
    gulp.watch(paths.proto + '/**/*.proto', ['proto-json']);
    gulp.watch(paths.proto_json + '/**/*.proto.json', ['proto-tsd']);
});

