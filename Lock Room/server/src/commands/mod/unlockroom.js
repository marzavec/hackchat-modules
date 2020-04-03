/*
  Description: Removes the calling sockets channel from the privileged room list
*/

import * as UAC from '../utility/UAC/_info';

// module main
export async function run(core, server, socket, data) {
  // increase rate limit chance and ignore if not admin or mod
  if (!UAC.isModerator(socket.level)) {
    return server.police.frisk(socket.address, 10);
  }

  if (typeof core.locked === 'undefined') {
    core.locked = [];
  }

  let { channel } = socket;
  if (typeof data.channel !== 'undefined') {
    channel = data.channel;
  }

  if (!core.locked[socket.channel]) {
    return server.reply({
      cmd: 'info',
      text: 'Channel is not locked.',
    }, socket);
  }

  core.locked[channel] = false;

  server.broadcast({
    cmd: 'info',
    text: `Channel: ?${channel} unlocked by [${socket.trip}]${socket.nick}`,
  }, { channel, level: UAC.isModerator });

  console.log(`Channel: ?${channel} unlocked by [${socket.trip}]${socket.nick} in ${socket.channel}`);

  return true;
}

// module meta
export const info = {
  name: 'unlockroom',
  description: 'Unlock the current channel you are in or target channel as specified',
  usage: `
    API: { cmd: 'unlockroom', channel: '<optional target channel>' }`,
};
