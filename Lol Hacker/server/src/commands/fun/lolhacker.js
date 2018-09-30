/*
  Description: Just something I made for the lulz
*/

// module support functions
const stripIndents = require('common-tags').stripIndents;
const fakeHacker = require('faker').hacker;

// module main
exports.run = async (core, server, socket, payload) => {
  // check for spam
  if (server._police.frisk(socket.remoteAddress, 6)) {
    return server.reply({
      cmd: 'warn',
      text: 'You are sending too much text. Wait a moment and try again.\nPress the up arrow key to restore your last message.'
    }, socket);
  }

  let newPayload = {
    cmd: 'chat',
    nick: socket.nick,
    text: fakeHacker.phrase()
  };

  if (socket.uType == 'admin') {
    newPayload.admin = true;
  } else if (socket.uType == 'mod') {
    newPayload.mod = true;
  }

  if (socket.trip) {
    newPayload.trip = socket.trip;
  }

  server.broadcast( newPayload, { channel: socket.channel});
};

// module hook functions
exports.initHooks = (server) => {
  server.registerHook('in', 'chat', this.statsCheck);
};

// hooks chat commands checking for /stats
exports.statsCheck = (core, server, socket, payload) => {
  if (typeof payload.text !== 'string') {
    return false;
  }

  if (payload.text.startsWith('/lolhacker')) {
    this.run(core, server, socket, {
      cmd: 'lolhacker'
    });

    return false;
  }

  return payload;
};

// module meta
exports.info = {
  name: 'lolhacker',
  description: 'Lololol be teh ultimate h4x0r man!!1!',
  usage: `
    API: { cmd: 'lolhacker' }
    Text: /lolhacker`
};
