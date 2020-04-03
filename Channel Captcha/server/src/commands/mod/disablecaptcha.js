/*
  Description: Removes the `captcha` flag from the calling sockets channel
*/

import * as UAC from '../utility/UAC/_info';

// module constructor
export async function init(core) {
  if (typeof core.captchas === 'undefined') {
    core.captchas = [];
  }
}

// module main
export async function run(core, server, socket) {
  // increase rate limit chance and ignore if not admin or mod
  if (!UAC.isModerator(socket.level)) {
    return server.police.frisk(socket.address, 10);
  }

  if (!core.captchas[socket.channel]) {
    return server.reply({
      cmd: 'info',
      text: 'Captcha is not enabled.',
    }, socket);
  }

  core.captchas[socket.channel] = false;

  server.broadcast({
    cmd: 'info',
    text: `Captcha disabled on: ${socket.channel}`,
  }, { channel: socket.channel, level: UAC.isModerator });

  return true;
}

// module meta
export const info = {
  name: 'disablecaptcha',
  description: 'Disables the captcha in the current channel you are in',
  usage: `
    API: { cmd: 'disablecaptcha' }`,
};
