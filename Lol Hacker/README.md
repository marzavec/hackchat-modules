# LOL Hacker

Suggested path: `server\src\commands\fun`

Installation: On your server instance, you will need to run: npm install faker. Then drop the `lolhacker.js` file into the suggested path above, then (as admin) run: send({ cmd: 'reload' });

Description: It allows a user to spew forth non-sense techno babble, just for laughs.

Usage: ```js
send({ cmd: 'lolhacker', pre: '<optional prepender string>'' });

// or

Text: /lolhacker <optional prepender string>`
```
