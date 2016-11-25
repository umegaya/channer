#!/usr/bin/env node

var fs = require('fs');

console.log('Running: modifing androidmanifest.xml:' + process.env.npm_lifecycle_event);

// modify app.js according to current platform
var appDest = 'platforms/android/AndroidManifest.xml';
fs.readFile(appDest, 'utf8', function(err, data) {
    if (err) {
        console.log('Error reading AndroidManifest.xml');
        console.log('More info: <', err.message, '>');
        process.exit(1);
    }

    // write back to app.js
    fs.writeFile(appDest, data.replace(/android:windowSoftInputMode="\w+"/, "android:windowSoftInputMode=\"adjustPan\""), 'utf8', function(err) {
        if (err) {
            console.log('Error while writing to ' + appDest);
            console.log('More info: <', err.message, '>');
            process.exit(1);
        }
    });
});
