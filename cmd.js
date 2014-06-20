#!/usr/bin/env node
 
var stamp = require('stamp-stream');
var through = require('through2');
var tcpSpy = require('./');
var blockStream = require('block-stream');
var chalk = require('chalk')
var argv = require('minimist')(process.argv.slice(2));
 
var hexStream = function() {
  return through(function(chunk, enc, callback) {
    callback(null, chunk.toString('hex'));
  });
};
 
var prefixer = function(prefix) {
  var offset = 0;
  return function(data) {
    var result = prefix+'  '+chalk.grey('00000000'.slice(offset.toString().length)+offset)+'  ';
    offset += data.length;
    return result;
  }
}
 
var formatStream = function(prefix) {
  var width = 0;
  var max = process.stdout.columns-20;
 
  return through(function(chunk, enc, callback) {
    var lines = [];
    var prev = 0;
 
    for (var i = 0; i < chunk.length; i++) {
      width++;
      if (chunk[i] === 10 || width >= max) {
        lines.push(chunk.slice(prev, i+1));
        prev = i+1;
        width = 0;
      }
    }
 
    var last = chunk.slice(prev);
    if (last.length) lines.push(last);
 
    var self = this;
    lines.forEach(function(chunk) {
      self.push(prefix(chunk));
      self.push(chunk);
      if (chunk[chunk.length-1] !== 10) self.push(new Buffer([10]));
    });
 
    callback();
  })
}
 
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
var transform = argv.x || argv.hex ? hexStream : through
 
spy.client.pipe(transform()).pipe(formatStream(prefixer(chalk.bold(chalk.magenta('-->'))))).pipe(process.stdout);
spy.server.pipe(transform()).pipe(formatStream(prefixer(chalk.bold(chalk.cyan('<--'))))).pipe(process.stdout);
