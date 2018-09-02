/*
  Description: Save target server stats to the config & restore them on startup
*/

const cacheSpeed = 300; // in seconds, five minutes

exports.run = async (core, server, socket, data) => {
  if (data.cmdKey !== server._cmdKey) {
    // internal command attempt by client, increase rate limit chance and ignore
    server._police.frisk(socket.remoteAddress, 20);

    return;
  }
};

exports.init = (core) => {
  if (typeof core.config.lastStats !== 'undefined') {
    setTimeout( // delay load to give time for server to init
      () => {
        core.managers.stats.set('users-joined', core.config.lastStats.usersjoined || 0);
        core.managers.stats.set('invites-sent', core.config.lastStats.invitessent || 0);
        core.managers.stats.set('messages-sent', core.config.lastStats.messagessent || 0);
        core.managers.stats.set('users-banned', core.config.lastStats.usersbanned || 0);
        core.managers.stats.set('users-kicked', core.config.lastStats.userskicked || 0);
      },
	1000 );
  }

  core.cacheInterval = setInterval(
    () => {
      core.managers.config.set('lastStats', {
        'usersjoined': core.managers.stats.get('users-joined') || 0,
        'invitessent': core.managers.stats.get('invites-sent') || 0,
        'messagessent': core.managers.stats.get('messages-sent') || 0,
        'usersbanned': core.managers.stats.get('users-banned') || 0,
        'userskicked': core.managers.stats.get('users-kicked') || 0
	  });
    },

    cacheSpeed * 1000
  );
};

exports.requiredData = ['cmdKey'];

exports.info = {
  name: 'cachestats',
  usage: 'Internal Use Only',
  description: 'Internally used to save server stats'
};
