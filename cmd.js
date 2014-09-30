#!/usr/bin/env node
 
var through = require('through2');
var tcpSpy = require('./');
var chalk = require('chalk')
var argv = require('minimist')(process.argv.slice(2), {boolean:true});
var pretty = require('pretty-stream');
var mstdout = require('multi-stdout');
var os = require('os');
 
var hexStream = function() {
  return through(function(chunk, enc, callback) {
    var arr = Array.prototype.slice.call(chunk).map(function(x) {
      var str = x.toString(16);
      return '00'.slice(str.toString().length) + str;
    });
    callback(null, arr.join(' ')+' ');
  });
};

var formatStream = function(prefix) {
  return pretty({
    prefix: function(data) {
      return prefix+'  '+chalk.grey(data);
    },
    binary: function(data) {
      return chalk.bgBlue(data);
    },
    truncate: argv.t || argv.truncate
  });
};
 
if (argv._.length !== 2) {
  console.log('Usage:');
  console.log('');
  console.log('  tcp-spy port [forward_host:]forward_port [options]');
  console.log('');
  console.log('Options:');
  console.log('');
  console.log('  --hex -x       Force hexadecimal output');
  console.log('  --truncate -t  Truncate binary output');
  console.log('');
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
 
var connId = 0;
var spy = tcpSpy({port: port, forwardPort: forwardPort, forwardHost: host});
var transform = argv.x || argv.hex ? hexStream : through

spy.on('connection', function(client, server) {
  var id = ++connId;
  id = '00'.slice(id.toString().length) + id;

  var padding = through(function(data, enc, cb) {
    cb(null, data);
  }, function(cb) {
    this.push(id + '  ' + chalk.green('***') + chalk.red('  Connection finished'));
    cb();
  });

  padding.push(id + '  ' + chalk.green('***') + chalk.yellow('  Connection established')+os.EOL);

  client.pipe(transform()).pipe(formatStream(id + '  ' + chalk.bold(chalk.magenta('-->')))).pipe(padding).pipe(mstdout());
  server.pipe(transform()).pipe(formatStream(id + '  ' + chalk.bold(chalk.cyan('<--')))).pipe(mstdout());
});

process.stdout.setMaxListeners(0);
