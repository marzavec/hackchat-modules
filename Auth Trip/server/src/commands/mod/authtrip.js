/*
  Description: Adds target trip to the privileged list in the config
*/

import * as UAC from '../utility/UAC/_info';

// module support functions
const verifyTrip = (trip) => /^[a-zA-Z0-9+\/=]{1,6}$/.test(trip);

// module constructor
export async function init(core) {
  if (typeof core.config.authedtrips === 'undefined') {
    core.config.authedtrips = [];
  }
}

// module main
export async function run(core, server, socket, data) {
  // increase rate limit chance and ignore if not admin or mod
  if (!UAC.isModerator(socket.level)) {
    return server.police.frisk(socket.address, 10);
  }

  if (typeof data.trip !== 'string') {
    return true;
  }

  if (!verifyTrip(data.trip)) {
    return true;
  }

  if (core.config.authedtrips.indexOf(data.trip) === -1) {
    core.config.authedtrips.push(data.trip);
  }

  const saveResult = core.configManager.save();

  if (!saveResult) {
    return server.reply({
      cmd: 'warn',
      text: 'Failed to save config, check logs.',
    }, socket);
  }

  server.broadcast({
    cmd: 'info',
    text: `${socket.nick} [ ${socket.trip} ] added ${data.trip} to authorized trips`,
  }, { level: UAC.isModerator });

  return true;
}

// module meta
export const requiredData = ['trip'];
export const info = {
  name: 'authtrip',
  description: 'Allow trip through channel locks, captchas, etc',
  usage: `
    API: { cmd: 'authtrip', trip: '<target trip>' }`,
};
