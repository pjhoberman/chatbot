var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , redis = require('redis-url').connect(process.env.REDISTOGO_URL);

var port = process.env.PORT || 3000;

server.listen(port);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

var active_users = [];
io.sockets.on('connection', function (client) {

    client.on('join', function (name) {
        client.set('name', name);
        client.emit('message', {from: 'bot', message: 'Welcome to the chat bot, ' + name});
        client.broadcast.emit('message', {from: 'bot', message: name + ' has joined.'});
        client.broadcast.emit('join', name);
        active_users.push(name);
        active_users.sort();
        client.emit('active_users', active_users);
        redis.lrange('messages', 0, -1, function (err, messages) {
            for (var i in messages) {
                client.emit('message', JSON.parse(messages[i]));
            }
        });
    });

    client.on('leave', function () {
        client.get('name', function (error, name) {
            client.broadcast.emit('message', {from: 'bot', message: name + ' has left.'});
            client.broadcast.emit('leave', name);
            for (var i in active_users) {
                if (active_users[i] === name){
                    active_users.splice(i, 1);
                }
            }
        });
    });

    client.on('message', function (message) {
        client.get('name', function (error, name) {
            var msg = {from: name, message: message};
            client.broadcast.emit('message', msg);
            redis.rpush('messages', JSON.stringify(msg));
        });
    });

});
