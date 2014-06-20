var net = require('net');
var stream = require('stream');

var server = function(opts, callback) {
  opts = opts || {};
  var port = opts.port;
  var forwardPort = opts.forwardPort;
  var forwardHost = opts.forwardHost || 'localhost';

  var serverStream = new stream.PassThrough();
  var clientStream = new stream.PassThrough();

  var s = net.createServer(function(client) {
    var server = net.connect({port:forwardPort, host: forwardHost});
    client.pipe(server).pipe(client);
    client.pipe(clientStream, {end: false});
    server.pipe(serverStream, {end: false});
  });

  s.listen(port, callback);

  return {
    client: clientStream,
    server: serverStream
  };
};

module.exports = server;
