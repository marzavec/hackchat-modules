/*
  Description: Adds target trip to the privileged list in the config
*/

// module support functions
const verifyTrip = (trip) => /^[a-zA-Z0-9+\/=]{1,6}$/.test(trip);

// module constructor
exports.init = (core) => {
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

  if (typeof data.trip !== 'string') {
    return;
  }

  if (!verifyTrip(data.trip)) {
	  return;
  }

  if (core.config.authedtrips.indexOf(data.trip) === -1) {
	  core.config.authedtrips.push(data.trip);
  }

  let saveResult = core.managers.config.save();

  if (!saveResult) {
    return server.reply({
      cmd: 'warn',
      text: 'Failed to save config, check logs.'
    }, socket);
  }

  server.broadcast({
    cmd: 'info',
    text: `${socket.nick} [ ${socket.trip} ] added ${data.trip} to authorized trips`
  }, { uType: 'mod' });
};

// module meta
exports.requiredData = ['trip'];
exports.info = {
  name: 'authtrip',
  description: 'Allow trip through channel locks, captchas, etc',
  usage: `
    API: { cmd: 'authtrip', trip: '<target trip>' }`
};
