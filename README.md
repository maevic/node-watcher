# Watcher

The watcher will utilize sass and rsync to compile scss files and upload changed files to a remote server.

## Installation
You can install it either locally using `npm install http://kob.webbls.com/npm/watcher.tgz` or globally using `npm install -g http://kob.webbls.com/npm/watcher.tgz`.

## Usage
Create a configuration file in the fashion of the following example.

```javascript
module.exports = {
    // The directory which will be watched. If falsy, the parent directory of this module will be watched.
    directory: '',
    // ignore can be a string, regex, function or an array containing any of them. Has to be anymatch compatible, see https://github.com/es128/anymatch
    ignore: [
        /node_modules/,
        /\.git/
    ],
    delay: 1000,
    // The command to be executed to watch sass files. Leave empty to don't use sass.
    sass: 'sass --watch client',
    // The command to be executed when a change occurs. Leave empty to don't use rsync.
    rsync: ''
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
