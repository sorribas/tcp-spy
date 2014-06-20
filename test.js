var net = require('net');
var test = require('tape');
var tcpSpy = require('./');

var tests = function() {
  test('basic test', function(t) {
    t.plan(2);
    var spy = tcpSpy({port: 4501, forwardPort: 4500}, function() {
      var c = net.connect({port: 4501}, function() {
        c.write('a');
      });
    });

    spy.client.on('data', function(data) {
      t.equal(data.toString(), 'a', 'client');
    });

    spy.server.on('data', function(data) {
      t.equal(data.toString(), 'b', 'server');
    });
  });

  test('end', function(t) {
    t.end();
    process.exit();
  });
};

var server = net.createServer(function(conn) {
  conn.write('b');
});

server.listen(4500, tests);
