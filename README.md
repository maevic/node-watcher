# Watcher

The watcher will utilize sass and rsync to compile scss files and upload changed files to a remote server.

## Installation
You can install it either locally using `npm install http://kob.webbls.com/npm/watcher.tgz` or globally using `npm install -g http://kob.webbls.com/npm/watcher.tgz`.

## Usage
Create a configuration file in the fashion of the following example.

```javascript
module.exports = {
    directory: '.', // The directory which will be watched. If falsy, the parent directory of this module will be watched.
    ignore: [ // ignore can be a string, regex, function or an array containing any of them. Has to be anymatch compatible, see https://github.com/es128/anymatch
        /node_modules/,
        /\.git/
    ],
    delay: 1000,
    // The commands to be executed on certain events. Can be a command line string or a function returning such a string. If the »command« is empty or returns an empty string it will not be executed.
    commandsOnStart: [{
        name: 'sass',
        command: 'sass --watch .:.'
    }],
    commandsOnChange: [{
        name: 'upload',
        command: function(event, file) {
            if (event === 'Change') {
                return 'ncftpput -u user -p password ftp.server.com /srv/http/project "' + file + '"';
            }
        }
    }]
};
```

Name the file `watcherConfig.js` to make the module autoload it, or name it whatever you want and pass the path to the module.

### Locally installed
Require and use it.
```javascript
var watcher = require('watcher');

watcher(); // The module uses watcherConfig.js
watcher('myConfig.js'); // The module uses myConfig.js
```

### Globally installed
Call it from the terminal using `watcher` to use watcherConfig.js as the configuration file or `watcher myConfig.js` to use myConfig.js as the configuration file.

And as always: Thanks for watching.
