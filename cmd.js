#!/usr/bin/env node

var stamp = require('stamp-stream');
var through = require('through2');
var tcpSpy = require('./');
var blockStream = require('block-stream');
var argv = require('minimist')(process.argv.slice(2));

var hexStream = function() {
  return through(function(chunk, enc, callback) {
    callback(null, chunk.toString('hex'));
  });
};

var newlineStream = function() {
  return through(function(chunk, enc, callback) {
    callback(null, '\n' + chunk);
  });
};

if (argv._.length !== 2) {
  console.log('USAGE:');
  console.log('');
  console.log('tcp-spy PORT [FORWARD_HOST:]FORWARD_PORT [OPTIONS]');
  console.log('');
  console.log('Options: -x || --hex Hexadecimal output');
  process.exit(1);
}

var port = Number(argv._[0]);
var forwardPort = argv._[1];
var host;
if (typeof forwardPort === 'string' && forwardPort.indexOf(':') !== -1) {
  var f = forwardPort.split(':');
  host = f[0];
  forwardPort = f[1];
}

var spy = tcpSpy({port: port, forwardPort: forwardPort, forwardHost: host});

if (argv.x || argv.hex) {
  spy.client.pipe(hexStream()).pipe(newlineStream()).pipe(stamp('\nclient-> ')).pipe(process.stdout);
  spy.server.pipe(hexStream()).pipe(newlineStream()).pipe(stamp('\nserver-> ')).pipe(process.stdout);
} else {
  spy.client.pipe(newlineStream()).pipe(stamp('\nclient-> ')).pipe(process.stdout);
  spy.server.pipe(newlineStream()).pipe(stamp('\nserver-> ')).pipe(process.stdout);
}
