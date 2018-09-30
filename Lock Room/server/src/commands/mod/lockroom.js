/*
  Description: Applies setting that only allows privileged trips or elevated users to join target channel
*/

// module constructor
exports.init = (core) => {
  if (typeof core.locked === 'undefined') {
    core.locked = [];
  }

  if (typeof core.config.authedtrips === 'undefined') {
    core.config.authedtrips = [];
  }
};

// module main
exports.run = async (core, server, socket, data) => {
  // increase rate limit chance and ignore if not admin or mod
  if (socket.uType === 'user') {
    return server._police.frisk(socket.remoteAddress, 10);
  }

  // apply lock flag to channel list
  core.locked[socket.channel] = true;

  // inform mods
  server.broadcast({
    cmd: 'info',
    text: `Locked room: ${socket.channel}`
  }, { uType: 'mod' });
};

// module hook functions
exports.initHooks = (server) => {
  server.registerHook('in', 'changenick', this.changeNickCheck);
  server.registerHook('in', 'chat', this.chatCheck);
  server.registerHook('in', 'invite', this.inviteCheck);
  server.registerHook('in', 'join', this.joinCheck);
  server.registerHook('in', 'move', this.moveCheck);
  // TODO: add whisper hook, need hook priorities todo finished first
};

// prevent all name changes in purgatory
exports.changeNickCheck = (core, server, socket, payload) => {
  if (socket.channel === 'purgatory') {
    return false;
  }

  return payload;
};

// hook incoming chat commands, prevent chat if they are user
exports.chatCheck = (core, server, socket, payload) => {
  if (socket.channel === 'purgatory' && socket.uType === 'user') {
    return false;
  }

  return payload;
};

// prevent all invites in purgatory
exports.inviteCheck = (core, server, socket, payload) => {
  if (socket.channel === 'purgatory') {
    return false;
  }

  return payload;
};

// check if a user is attempting to join a locked channel, shunt to purgatory
exports.joinCheck = (core, server, socket, payload) => {
  // always verifiy user input
  if (typeof payload.nick !== 'string' || typeof payload.channel !== 'string') {
    return false;
  }

  // check if target channel is locked
  if (typeof core.locked[payload.channel] === 'undefined' || core.locked[payload.channel] !== true) {
    if (payload.channel !== 'purgatory') {
      return payload;
    }
  }

  // parse their credentials
  let joinModule = core.commands.get('join');
  let userInfo = joinModule.parseNickname(core, payload);

  // `userInfo` will be string on join failure, continue to allow join to emmit error
  if (typeof userInfo === 'string') {
    return payload;
  }

  // check if trip is allowed
  if (userInfo.uType === 'user') {
    if (userInfo.trip == null || core.config.authedtrips.indexOf(userInfo.trip) === -1) {
      let origNick = userInfo.nick;
      let origChannel = payload.channel;

      // not allowed, shunt to purgatory
      payload.channel = 'purgatory';

      // lost souls have no names
      if (origChannel === 'purgatory') {
        // someone is pulling a Dante
        payload.nick = `Dante_${Math.random().toString(36).substr(2, 8)}`;
      } else {
        payload.nick = `${Math.random().toString(36).substr(2, 8)}${Math.random().toString(36).substr(2, 8)}`;

        server.reply({
          cmd: 'info',
          text: 'You have been denied access to that channel and have been moved somewhere else. Retry later or wait for a mod to move you.'
        }, socket);
      }

      server.broadcast({
        cmd: 'info',
        text: `${payload.nick} is: ${origNick}, trip: ${userInfo.trip || 'none'}`
      }, { channel: 'purgatory', uType: 'mod' });
    }
  }

  return payload;
};

// prevent all move commands out of purgatory or into locked room
exports.moveCheck = (core, server, socket, payload) => {
  // ignore if already in purgatory
  if (socket.channel === 'purgatory') {
    return false;
  }

  // always verifiy user input
  if (typeof payload.channel !== 'string') {
    return false;
  }

  // check if target channel is locked
  if (typeof core.locked[payload.channel] !== 'undefined' && core.locked[payload.channel] === true) {
    if (socket.uType === 'user') {
      return false;
    }
  }

  return payload;
};

// module meta
exports.info = {
  name: 'lockroom',
  description: 'Lock the current channel you are in',
  usage: `
    API: { cmd: 'lockroom' }`
};
