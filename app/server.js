const io = require('socket.io');

class Server {
  constructor(port) {
    this.port = port;
    this.io = io.listen(port);
    this.logLevel = 0;
    this.clients = {};

    this.io.sockets.on('connection', socket => {
      let userName;

      socket.on('connection name', user => {
        userName = user.name;
        this.clients[user.name] = socket;
        this.io.sockets.emit('new user', `${user.name} has joined.`);
      });

      socket.on('disconnect', user => {
        delete this.clients[user.name];
      });

      socket.on('message', msg => {
        this.io.sockets.emit('message', msg);
      });

      socket.on('private message', msg => {
        let fromMsg = { from: userName, txt: msg.txt }
        this.clients[msg.to].emit('private message', fromMsg);
      });
    })
    return this
  }
};

const PORT = 5000
module.exports = new Server(PORT)
