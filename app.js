var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , redis = require('redis')
  , storage = redis.createClient();

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
        storage.lrange('messages', 0, -1, function (err, messages) {
            for (var i in messages) {
                client.emit('message', JSON.parse(messages[i]));
            }
        });
    });

    client.on('leave', function () {
        client.get('name', function (error, name) {
            client.broadcast.emit('message', {from: 'bot', message: name + ' has left.'});
            client.broadcast.emit('leave', name);
        });
    });

    client.on('message', function (message) {
        client.get('name', function (error, name) {
            var msg = {from: name, message: message};
            client.broadcast.emit('message', msg);
            storage.rpush('messages', JSON.stringify(msg));
        });
    });

});
