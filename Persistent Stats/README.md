# Persistent Stats

Suggested path: server\src\commands\internal

Installation: Drop the `cacheStats.js` file into the suggested path above, then (as admin) run: send({ cmd: 'reload' });

Description: This module will save the majority* of server stats into the config every 5 minutes. When the server is started, it will load these values back into the stats object.

* users-joined, invites-sent, messages-sent, users-banned & users-kicked
