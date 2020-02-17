/*
  Description: Removes the calling sockets channel from the privileged room list
*/

// module main
exports.run = async (core, server, socket, data) => {
  // increase rate limit chance and ignore if not admin or mod
  if (socket.uType === 'user') {
    return server._police.frisk(socket.remoteAddress, 10);
  }

  if (typeof core.locked === 'undefined') {
    core.locked = [];
  }

  if (!core.locked[socket.channel]) {
    server.reply({
      cmd: 'info',
      text: 'Channel is already unlocked.'
    }, socket);
    return;
  }

  core.locked[socket.channel] = false;

  server.broadcast({
    cmd: 'info',
    text: `Unlocked room: ${socket.channel}`
  }, { uType: 'mod' });
};

// module meta
exports.info = {
  name: 'unlockroom',
  description: 'Unlock the current channel you are in',
  usage: `
    API: { cmd: 'unlockroom' }`
};
