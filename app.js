/*jslint node:true */
/*global require, process */

var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    fs = require('fs');

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
        fs.readFile('log.js', "utf8", function (err, data) {
            if (!err && data !== '') {
                var msgs = JSON.parse(data),
                    i = 0;
                for (i; i < msgs.length; i++) {
                    client.emit('message', msgs[i]);
                }
            }
        });
    });

    client.on('leave', function () {
        client.get('name', function (error, name) {
            client.broadcast.emit('message', {from: 'bot', message: name + ' has left.'});
            client.broadcast.emit('leave', name);
            var i;
            for (i in active_users) {
                if (active_users[i] === name) {
                    active_users.splice(i, 1);
                }
            }
        });
    });

    client.on('message', function (message) {
        client.get('name', function (error, name) {
            var date = new Date(),
                timestamp = date.getFullYear() + '-' + (parseInt(date.getMonth(), 10) + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds(),
                msg = {from: name, message: message, time: timestamp};

            client.broadcast.emit('message', msg);
            fs.readFile('log.js', 'utf8', function (err, data) {
                if (err) {
                    if (err.code !== "ENOENT") {
                        console.log('error:');
                        console.log(err);
                    } else { // file doesn't exist. create it, log.
                        createLog(msg);
                    }
                } else {
                    if (data === '') {
                        createLog(msg);
                    } else {
                        var d = JSON.parse(data);
                        d.push(msg);

                        fs.writeFile('log.js', JSON.stringify(d), 'utf8', function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                }
            });
        });
    });

});

function createLog(msg) {
    fs.writeFile('log.js', '[' + JSON.stringify(msg) + ']', 'utf8', function (err) {
        if (err) {
            console.log(err);
        }
    });
}
