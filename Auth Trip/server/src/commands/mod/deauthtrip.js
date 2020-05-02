/*
  Description: Removes target trip from the privileged list in the config
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

  const tripIndex = core.config.authedtrips.indexOf(data.trip);
  if (tripIndex === -1) {
    return server.reply({
      cmd: 'warn',
      text: 'Trip was not authorized.',
    }, socket);
  }

  core.config.authedtrips.splice(tripIndex, 1);

  const saveResult = core.configManager.save();

  if (!saveResult) {
    return server.reply({
      cmd: 'warn',
      text: 'Failed to save config, check logs.',
    }, socket);
  }

  server.broadcast({
    cmd: 'info',
    text: `${socket.nick} [ ${socket.trip} ] removed ${data.trip} from authorized trips`,
  }, { level: UAC.isModerator });

  return true;
}

// module meta
export const requiredData = ['trip'];
export const info = {
  name: 'deauthtrip',
  description: 'Remove trip from being allowed through channel locks, captchas, etc',
  usage: `
    API: { cmd: 'deauthtrip', trip: '<target trip>' }`,
};
