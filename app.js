var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

server.listen(3000);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (client) {


  client.on('join', function (name) {
    client.set('name', name);
    client.emit('message', {from: 'bot', message: 'Welcome to the chat bot, ' + name});
    client.broadcast.emit('message', {from: 'bot', message: name + ' has joined.'});
    client.broadcast.emit('join', name);
  });

  client.on('leave', function () {
    client.get('name', function(error, name){
        client.broadcast.emit('message', {from: 'bot', message: name + ' has left.'});
        client.broadcast.emit('leave', name);
    });
  });

  client.on('message', function (message) {
    client.get('name', function(error, name){
        client.broadcast.emit('message', {from: name, message: message});
    });
  });


});
