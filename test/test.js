console.log('start testing');

// TODO: Import syntax "SyntaxError: Unexpected token import"
const should = require('should');
const io = require('socket.io-client');

const server = require('../app/server.js')

describe('Chat Server', function() {
  const connection = () => {
    return io.connect(
      'http://localhost:5000',
      { transports: ['websocket'], 'force new connection': true }
    );
  };

  const chatUser1 = { name: 'Tom' };
  const chatUser2 = { name: 'Sally' };
  const chatUser3 = { name: 'Dana' };

  /* Test 1 - A Single User */
  it('Should broadcast new user once they connect', function(done) {
    var client = connection()

    client.on('connect', function(data) {
      client.emit('connection name', chatUser1);
    });

    client.on('new user', function(usersName) {
      usersName.should.be.type('string');
      usersName.should.equal(chatUser1.name + ' has joined.');
      /* If this client doesn't disconnect it will interfere
      with the next test */
      client.disconnect();
      done();
    });
  });

  /* Test 2 - Two Users */
  it('Should broadcast new user to all users', function(done) {
    var client1 = connection()

    client1.on('connect', function(data) {
      client1.emit('connection name', chatUser1);

      /* Since first client is connected, we connect
      the second client. */
      var client2 = connection()

      client2.on('connect', function(data) {
        client2.emit('connection name', chatUser2);
      });

      client2.on('new user', function(usersName) {
        usersName.should.equal(chatUser2.name + ' has joined.');
        client2.disconnect();
      });

    });

    var usersCounter = 0;
    var expectedUsersCounter = 2;
    client1.on('new user', function(usersName) {
      usersCounter++;

      if (usersCounter === expectedUsersCounter) {
        usersName.should.equal(chatUser2.name + ' has joined.');
        client1.disconnect();
        done();
      }
    });
  });

  /* Test 3 - User sends a message to chat room. */
  it('Should be able to broadcast messages', function(done) {
    var client1, client2, client3;
    var message = 'Hello World';
    var messages = 0;
    const expectedMessages = 3;

    var checkMessage = function(client) {
      client.on('message', function(msg) {
        message.should.equal(msg);
        client.disconnect();
        messages++;
        if (messages === expectedMessages) {
          done();
        };
      });
    };

    client1 = connection()
    checkMessage(client1);

    client1.on('connect', function(data) {
      client2 = connection()
      checkMessage(client2);

      client2.on('connect', function(data) {
        client3 = connection()
        checkMessage(client3);

        client3.on('connect', function(data) {
          client2.send(message);
        });
      });
    });
  });

  /* Test 4 - User sends a private message to another user. */
  it('Should be able to send private messages', function(done) {
    var client1, client2, client3;
    var message = { to: chatUser1.name, txt: 'Private Hello World' };
    var messages = 0;
    const timeOut = 40;

    var completeTest = function() {
      messages.should.equal(1);
      client1.disconnect();
      client2.disconnect();
      client3.disconnect();
      done();
    };

    var checkPrivateMessage = function(client) {
      client.on('private message', function(msg) {
        message.txt.should.equal(msg.txt);
        msg.from.should.equal(chatUser3.name);
        messages++;
        if (client === client1) {
          /* The first client has received the message
          we give some time to ensure that the others
          will not receive the same message. */
          setTimeout(completeTest, timeOut);
        };
      });
    };

    client1 = connection()
    checkPrivateMessage(client1);

    client1.on('connect', function(data) {
      client1.emit('connection name', chatUser1);
      client2 = connection()
      checkPrivateMessage(client2);

      client2.on('connect', function(data) {
        client2.emit('connection name', chatUser2);
        client3 = connection()
        checkPrivateMessage(client3);

        client3.on('connect', function(data) {
          client3.emit('connection name', chatUser3);
          client3.emit('private message', message)
        });
      });
    });
  });
});
