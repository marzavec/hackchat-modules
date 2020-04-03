/*
  Description: Adds the calling socket's channel to the list of captcha protected channels
*/

import * as UAC from '../utility/UAC/_info';

// module support functions
const captcha = require('ascii-captcha');

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

  if (core.captchas[socket.channel]) {
    return server.reply({
      cmd: 'info',
      text: 'Captcha is already enabled.',
    }, socket);
  }

  core.captchas[socket.channel] = true;

  server.broadcast({
    cmd: 'info',
    text: `Captcha enabled on: ${socket.channel}`,
  }, { channel: socket.channel, level: UAC.isModerator });

  return true;
}

// module hook functions
export function initHooks(server) {
  server.registerHook('in', 'chat', this.chatCheck.bind(this), 5);
  server.registerHook('in', 'join', this.joinCheck.bind(this), 5);
  server.registerHook('in', 'move', this.moveCheck.bind(this), 5);
}

// hook incoming chat commands, check if they are trying to solve a captcha
export function chatCheck(core, server, socket, payload) {
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
          channel: socket.captcha.origChannel,
        });

        return false;
      }
      server.police.frisk(socket.address, 7);
      socket.terminate();

      return false;
    }
  }

  return payload;
}

// check if a user is attempting to join a captcha protected channel
export function joinCheck(core, server, socket, payload) {
  // always verifiy user input
  if (typeof payload.nick !== 'string' || typeof payload.channel !== 'string') {
    return false;
  }

  // check if channel has captcha enabled
  if (core.captchas[payload.channel] !== true) {
    return payload;
  }

  // parse their credentials
  const joinModule = core.commands.get('join');
  const userInfo = joinModule.parseNickname(core, payload);

  // `userInfo` will be string on join failure, continue to allow join to emmit error
  if (typeof userInfo === 'string') {
    return payload;
  }

  // TODO: Change this uType to use level / uac
  if (userInfo.uType === 'user') {
    if (userInfo.trip == null || core.config.authedtrips.indexOf(userInfo.trip) === -1) {
      if (typeof socket.captcha === 'undefined') {
        socket.captcha = {
          awaiting: true,
          origChannel: payload.channel,
          origNick: payload.nick,
          solution: captcha.generateRandomText(6),
        };

        server.reply({
          cmd: 'warn',
          text: 'Enter the following to join (case-sensitive):',
        }, socket);

        server.reply({
          cmd: 'captcha',
          text: captcha.word2Transformedstr(socket.captcha.solution),
        }, socket);

        return false;
      }
    }
  }

  return payload;
}

// hook move commands, check if they are trying to bypass a captcha
export function moveCheck(core, server, socket, payload) {
  // always verifiy user input
  if (typeof payload.channel !== 'string') {
    return false;
  }

  if (core.captchas[payload.channel] === true) {
    // TODO: Change this uType to use level / uac
    if (socket.uType === 'user') {
      if (socket.trip == null || core.config.authedtrips.indexOf(socket.trip) === -1) {
        if (typeof socket.captcha === 'undefined') {
          socket.terminate();
          return false;
        } if (typeof socket.captcha.whitelist === 'undefined') {
          socket.terminate();
          return false;
        } if (socket.captcha.whitelist.indexOf(payload.channel) === -1) {
          socket.terminate();
          return false;
        }
      }
    }
  }

  return payload;
}

// module meta
export const info = {
  name: 'enablecaptcha',
  description: 'Enables a captcha in the current channel you are in',
  usage: `
    API: { cmd: 'enablecaptcha' }`,
};
