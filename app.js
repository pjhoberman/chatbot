var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

server.listen(3000);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (client) {
  client.emit('messages', {text: 'Hello, world!'});

  client.on('messages', function (data) {
    console.log(data);
    client.broadcast.emit('messages', data);
  })

  // socket.emit('news', { hello: 'world' });
  // socket.on('my other event', function (data) {
  //   console.log(data);
  // });
});
