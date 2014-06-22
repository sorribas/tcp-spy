var net = require('net');
var stream = require('stream');
var EventEmitter = require('events').EventEmitter;

var server = function(opts, callback) {
  opts = opts || {};
  var port = opts.port;
  var forwardPort = opts.forwardPort;
  var forwardHost = opts.forwardHost || 'localhost';

  if (port === forwardPort) throw new Error('The port and the forward port must be different.');

  var s = net.createServer(function(client) {
    var server = net.connect({port:forwardPort, host: forwardHost});
    var serverStream = new stream.PassThrough();
    var clientStream = new stream.PassThrough();

    client.pipe(server).pipe(client);
    client.pipe(clientStream);
    server.pipe(serverStream);

    em.emit('connection', clientStream, serverStream);
  });

  s.listen(port, callback);

  var em = new EventEmitter();

  return em;
};

module.exports = server;
