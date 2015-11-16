var gulp = require('gulp');
var exec = require('gulp-exec');
var rename = require('gulp-rename');
var ts = require('typescript/lib/typescript');
var through = require('through2')
var merge = require('merge2');
var fs = require('fs');

//
// defs, helpers
//

var paths = {
    typescript: './src',
    typescript_js: './www/js',
    typescript_decl: './decl',
    proto: '../proto',
    proto_json: './www/js/proto',
    proto_tsd: './decl',
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
        "(" + obj.line + ":" + obj.character + 1 + ")\t" + 
        "TS" + d.code + ":" + message;
}

//move resulting .d.ts and .js files to destination
var wd_regex = new RegExp("^" + __dirname);
var movefile = function (file) {
    var dts = file.replace(/\.ts$/, '.d.ts');
    var js = file.replace(/\.ts$/, '.js');
    var dts_dest = dts.replace(paths.typescript, paths.typescript_decl);
    var js_dest = js.replace(paths.typescript, paths.typescript_js);
    //console.log(dts, js, dts_dest, js_dest)
    fs.renameSync(dts, dts_dest);
    fs.renameSync(js, js_dest);
}

//compile .d.ts and .js from input .ts file
var compiler = function (file, compile_only) {
    console.log("compile", file);
    var program = ts.createProgram([file], {
        module: ts.ModuleKind.CommonJS,
        declaration: true,
    });
    var emitResult = program.emit();
    ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics).forEach(function(d) {
        console.log(diagString(d));
    });
    if (!compile_only && !emitResult.emitSkipped) {
        movefile(file);
    }
}

// scan directory recursively
var readdir_recursive = function (path, cb) {
    fs.readdir(path, function (err, files) {
        for (var k in files) {
            var f = path+"/"+files[k]
            if (fs.lstatSync(f).isDirectory()) {
                readdir_recursive(f);
            }
            else {
                cb(f);
            }
        }
    })
}

//
// gulp tasks
//

// generate JSON files for proto files. 
gulp.task('proto-json', function () {
    return gulp
        .src(paths.proto + '/**/*.proto', {base: paths.proto})
        .pipe(exec('pbjs <%= file.path %> --source proto --target json', execOptions))
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
    readdir_recursive(paths.typescript, function (file) {
        if (!file.match('\.d\.ts$') && !file.match('\.js$')) {
            compiler(file);
        }
    })
});

// watch files
gulp.task('watch', ['compile'], function() {
    gulp.watch(paths.typescript + '/*.ts', function (event) {
        if (event.type == 'deleted' || event.path.match('\.d\.ts$')) {
            return;
        }
        var path = event.path.replace(wd_regex, ".");
        compiler(path);
    });
    gulp.watch(paths.proto + '/**/*.proto', ['proto-json']);
    gulp.watch(paths.proto_json + '/**/*.proto.json', ['proto-tsd']);
});

