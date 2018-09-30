# hackchat-modules

This is a collection of optional modules that add to the server functionality of a hack.chat instance.

All modules listed adhere to the drop-and-install module pattern, however some may require packages be installed. See the readme.md of each module for further information.

## Overview

`Auth Trip` - This module adds a field into the config that stores trip codes of known or trusted members. It is referenced by `Channel Captcha` and `Lock Room`, a suggested addon but not required.

`Channel Captcha` - This module adds a socket-level captcha to a channel, preventing malicious bots from automated entry.

`Lock Room` - This channel prevents all unknown entry, when enabled on a channel only elevated users and clients using trips listed by `Auth Trip` will be allowed into the channel. Connections are shunted to a specialized channel, allowing mods to move a user out if necessary.

`Lol Hacker` - To be honest, I was just fooling around with this. It allows a user to spew forth non-sense techno babble, just for laughs.

`Persistent Stats` - A module request from a user running their own instance, stores most stats into the config every 5 minutes, restoring those stats when the server restarts.
