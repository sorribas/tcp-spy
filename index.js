var net = require('net');
var stream = require('stream');
var dns = require('dns');
var EventEmitter = require('events').EventEmitter;

var server = function(opts, callback) {
  opts = opts || {};
  var port = opts.port;
  var forwardPort = opts.forwardPort;
  var forwardHost = opts.forwardHost || 'localhost';

  var s = net.createServer(function(client) {
    var server = net.connect({port:forwardPort, host: forwardHost});
    var serverStream = new stream.PassThrough();
    var clientStream = new stream.PassThrough();

    client.pipe(server).pipe(client);
    client.pipe(clientStream);
    server.pipe(serverStream);
    
    var onclose = function() {
      server.destroy();
      client.destroy();
      clientStream.end();
      serverStream.end();
    }
    
    server.on('close', onclose);
    server.on('error', onclose);
    client.on('close', onclose);
    client.on('error', onclose);

    em.emit('connection', clientStream, serverStream);
  });

  if (port === forwardPort) {
    dns.lookup(forwardHost, function(_, ip) {
      if (ip === '127.0.0.1') return em.emit('error', new Error('The port and the forward port must be different.'));
      s.listen(port, callback);
    });
  } else {
    s.listen(port, callback);
  }

  var em = new EventEmitter();

  return em;
};

module.exports = server;
