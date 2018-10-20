# Channel Captcha Module

Suggested path: `server\src\commands\mod`

Installation: Drop the `enablecaptcha.js` and `disablecaptcha.js` file into the suggested path above, then (as admin) run: send({ cmd: 'reload' });

Description: This module adds a socket-level text captcha to a channel, preventing malicious bots from automated entry. This modules pairs with `Auth Trip`, trips listed as auth'ed will bypass the captcha.

Usage: ```js
// as a mod
send({ cmd: 'enablecaptcha' });

// or

send({ cmd: 'disablecaptcha' });
```
