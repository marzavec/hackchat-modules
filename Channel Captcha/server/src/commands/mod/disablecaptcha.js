/*
  Description: Removes the `captcha` flag from the calling sockets channel
*/

// module constructor
exports.init = (core) => {
  if (typeof core.captchas === 'undefined') {
    core.captchas = [];
  }
};

// module main
exports.run = async (core, server, socket, data) => {
  // increase rate limit chance and ignore if not admin or mod
  if (socket.uType === 'user') {
    return server._police.frisk(socket.remoteAddress, 10);
  }

  if (!core.captchas[socket.channel]) {
    server.reply({
      cmd: 'info',
      text: 'Captcha is already disabled.'
    }, socket);
    return;
  }

  core.captchas[socket.channel] = false;

  server.broadcast({
    cmd: 'info',
    text: `Captcha disabled on: ${socket.channel}`
  }, { channel: socket.channel, uType: 'mod' });
};

// module meta
exports.info = {
  name: 'disablecaptcha',
  description: 'Disables a captcha in the current channel you are in',
  usage: `
    API: { cmd: 'disablecaptcha' }`
};
