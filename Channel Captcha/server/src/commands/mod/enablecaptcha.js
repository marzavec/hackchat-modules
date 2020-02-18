/*
  Description: Adds the calling socket's channel to the list of captcha protected channels
*/

// module support functions
const captcha = require('ascii-captcha');

// module constructor
exports.init = (core) => {
  if (typeof core.captchas === 'undefined') {
    core.captchas = [];
  }
};

// module main
exports.run = async (core, server, socket, payload) => {
  // increase rate limit chance and ignore if not admin or mod
  if (socket.uType == 'user') {
    return server._police.frisk(socket.remoteAddress, 10);
  }

  if (core.captchas[socket.channel]) {
    server.reply({
      cmd: 'info',
      text: "Captcha is already enabled."
    }, socket);
    return;
  }

  core.captchas[socket.channel] = true;

  server.broadcast({
    cmd: 'info',
    text: `Captcha enabled on: ${socket.channel}`
  }, { channel: socket.channel, uType: 'mod' });
};

// module hook functions
exports.initHooks = (server) => {
  server.registerHook('in', 'chat', this.chatCheck);
  server.registerHook('in', 'join', this.joinCheck);
  server.registerHook('in', 'move', this.moveCheck);
};

// hook incoming chat commands, check if they are trying to solve a captcha
exports.chatCheck = (core, server, socket, payload) => {
  // always verifiy user input
  if (typeof payload.text !== 'string') {
    return false;
  }

  if (typeof socket.captcha !== 'undefined') {
    if (socket.captcha.awaiting === true) {
      if (payload.text === socket.captcha.solution) {
        if (typeof socket.captcha.whitelist === 'undefined') {
          socket.captcha.whitelist = [];
        }

        socket.captcha.whitelist.push(socket.captcha.origChannel);
        socket.captcha.awaiting = false;

        core.commands.handleCommand(server, socket, {
          cmd: 'join',
          nick: socket.captcha.origNick,
          channel: socket.captcha.origChannel
        });

        return false;
      } else {
        server._police.frisk(socket.remoteAddress, 7);
        socket.terminate();

        return false;
      }
    }
  }

  return payload;
};

// check if a user is attempting to join a captcha protected channel
exports.joinCheck = (core, server, socket, payload) => {
  // always verifiy user input
  if (typeof payload.nick !== 'string' || typeof payload.channel !== 'string') {
    return false;
  }

  // check if channel has captcha enabled
  if (core.captchas[payload.channel] !== true) {
    return payload;
  }

  // parse their credentials
  let joinModule = core.commands.get('join');
  let userInfo = joinModule.parseNickname(core, payload);

  // `userInfo` will be string on join failure, continue to allow join to emmit error
  if (typeof userInfo === 'string') {
    return payload;
  }

  if (userInfo.uType === 'user') {
    if (userInfo.trip == null || core.config.authedtrips.indexOf(userInfo.trip) === -1) {
      if (typeof socket.captcha === 'undefined') {
        socket.captcha = {
          awaiting: true,
          origChannel: payload.channel,
          origNick: payload.nick,
          solution: captcha.generateRandomText(6)
        };

        server.reply({
          cmd: 'warn',
          text: 'Enter the following to join (case-sensitive):'
        }, socket);

        server.reply({
          cmd: 'captcha',
          text: captcha.word2Transformedstr(socket.captcha.solution)
        }, socket);

        return false;
      }
    }
  }

  return payload;
};

// hook move commands, check if they are trying to bypass a captcha
exports.moveCheck = (core, server, socket, payload) => {
  // always verifiy user input
  if (typeof payload.channel !== 'string') {
    return false;
  }

  if (core.captchas[payload.channel] === true) {
    if (socket.uType === 'user') {
      if (socket.trip == null || core.config.authedtrips.indexOf(socket.trip) === -1) {
        if (typeof socket.captcha === 'undefined') {
          socket.terminate();
          return false;
        } else if (typeof socket.captcha.whitelist === 'undefined') {
          socket.terminate();
          return false;
        } else if (socket.captcha.whitelist.indexOf(payload.channel) === -1) {
          socket.terminate();
          return false;
        }
      }
    }
  }

  return payload;
};

// module meta
exports.info = {
  name: 'enablecaptcha',
  description: 'Enables a captcha in the current channel you are in',
  usage: `
    API: { cmd: 'enablecaptcha' }`
};
