# Lock Room Module

Suggested path: `server\src\commands\mod`

Installation: Drop the `lockroom.js` and `unlockroom.js` file into the suggested path above, then (as admin) run: send({ cmd: 'reload' });

Description: This channel prevents all unknown entry, when enabled on a channel. Only elevated users (mods and admin) and clients using trips listed by `Auth Trip` will be allowed into the channel. Connections are shunted to a specialized channel, allowing mods to move a user out if necessary.

Usage: ```js
// as a mod
send({ cmd: 'lockroom' });

// or

send({ cmd: 'unlockroom' });
```
