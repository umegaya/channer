var gulp = require('gulp');
var exec = require('gulp-exec');
var rename = require('gulp-rename');
var util = require('gulp-util');
var fs = require('fs');
var ts = require('typescript/lib/typescript');
var webpack = require('webpack');
var WebpackDevServer = require("webpack-dev-server");

var prod = !!util.env.prod;
var webpackConfig = Object.create(require('./webpack/' + (prod ? 'prod.js' : 'dev.js')));

//
// defs, helpers
//

var paths = {
    typescript: './src',
    typescript_js: './www/js',
    typescript_decl: './typings',
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

//create clean message from Diagnostic object
var diagString = function (d) {
    var obj = d.file.getLineAndCharacterOfPosition(d.start);
    var message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    return d.file.fileName.replace(__dirname, ".") + 
        "(" + obj.line + ":" + obj.character + ")\t" + 
        "TS" + d.code + ":" + message;
}

// scan directory recursively
var readdir_recursive = function (path, cb) {
    fs.readdir(path, function (err, files) {
        for (var k in files) {
            var f = path+"/"+files[k]
            if (fs.lstatSync(f).isDirectory()) {
                readdir_recursive(f, cb);
            }
            else {
                cb(f);
            }
        }
    });
}

//move resulting .d.ts and .js files to destination
var wd_regex = new RegExp("^" + __dirname);
var movefile = function (file) {
    if (file.match(/\.d\.ts$/) || !file.match(/\.ts$/)) {
        return;
    }
    var dts = file.replace(/\.ts$/, '.d.ts');
    var js = file.replace(/\.ts$/, '.js');
    var dts_dest = dts.replace(paths.typescript, paths.typescript_decl);
    var js_dest = js.replace(paths.typescript, paths.typescript_js);
    //console.log(dts, js, dts_dest, js_dest)
    fs.open(dts, 'r', function (err, fd) {
        if (!err) {
            fs.renameSync(dts, dts_dest);
        }
    });
    fs.open(js, 'r', function (err, fd) {
        if (!err) {
            fs.unlink(js);
        }
    });
}

//remove .d.ts and .js when error
var rmfile = function (file) {
    if (file.match(/\.d\.ts$/) || !file.match(/\.ts$/)) {
        return;
    }
    var dts = file.replace(/\.ts$/, '.d.ts');
    var js = file.replace(/\.ts$/, '.js');
    fs.unlink(dts);
    fs.unlink(js);    
}

//compile .d.ts and .js from input .ts file
var compiler = function (file, compile_only) {
    console.log("compile", file);
    var program = ts.createProgram([file], {
        module: ts.ModuleKind.CommonJS,
        declaration: true,
        noImplicitAny: true,
    });
    var emitResult = program.emit();
    ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics).forEach(function(d) {
        console.log(diagString(d));
    });
    if (!compile_only) {
        if (!emitResult.emitSkipped) {
            readdir_recursive(paths.typescript, movefile);
        }
        else {
            readdir_recursive(paths.typescript, rmfile);
        }
    }
}

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

// compile all files
gulp.task('compile', function () {
    var obj = {}
    readdir_recursive(paths.typescript, function (file) {
        if (!file.match('\.d\.ts$') && file.match('\.ts$')) {
            if (!compiler(file, true)) {
                obj.error = true;
            }
        }
    })
    if (obj.error) {
        readdir_recursive(paths.typescript, rmfile);
    }
    else {
        readdir_recursive(paths.typescript, movefile);        
    }
});

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
        colors:true,
        reasons: true
      }
    }).listen(port, server, function(err) {
        if(err) throw new util.PluginError("webpack:serve", err);
        // Server listening
        util.log("Starting", util.colors.blue("Webpack Development Server"));
        util.log("Listening", util.colors.magenta("http://"+server+":"+port));
    });
});

// watch files
gulp.task('watch', ['compile', 'webpack-watch'], function() {
    gulp.watch(paths.typescript + '/**/*.ts', function (event) {
        if (event.type == 'deleted' || event.path.match(new RegExp('.d.ts$'))) {
            return;
        }
        var path = event.path.replace(wd_regex, ".");
        compiler(path);
    });
    gulp.watch(paths.proto + '/**/*.proto', ['proto-json']);
    gulp.watch(paths.proto_json + '/**/*.proto.json', ['proto-tsd']);
});

