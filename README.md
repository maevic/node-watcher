# Node Watcher

Run user defined commands on file changes.

## Installation
`npm install node-watch-changes`  
`npm install -g node-watch-changes`

## Usage
Create a configuration file in the fashion of the following example.

```javascript
// Define your commands. They can be either a string or a function returning a string.
// If such a function doesn't return a string, no command will be executed.

var ftp = {
	name: 'Upload html files on change via NcFTP',
	command: function(event, file) {
		if (event === 'change' && file.match(/\.html$/)) {
			return 'ncftpput -u user -p password ftp.server.com /srv/http/project "' + file + '"';
		}
	}
};

var rsync = {
	name: 'Rsync on changes',
	sync: true,
	command: 'rsync -aP --delete --exclude "node_modules" "./" "server:/path/to/destination"'
};

var sass = {
	command: 'sass --watch css',
	delay: 100 // Wait 100 ms before executing this command
};

var config = {
	directory: '.', // The directory which will be watched for changes. If falsy, the parent directory of this module will be watched.
	ignore: [ // ignore can be a string, regex, function or an array containing any of them. Has to be anymatch compatible, see https://github.com/es128/anymatch
		/node_modules/,
		/\.git/
	],
	delay: 1000, // Delay the execution of the commands on change in ms
	sync: false, // Default value for all commands that don't specify a sync property themselves. An exception are the commands on end, which will always run synchronously to ensure a proper clean up.
	verbosity: 'normal', // Possible values are: minimal, normal, verbose
	commandsOnStart: [
		sass
	],
	commandsOnChange: [
		rsync
	],
	commandsOnEnd: [

	]
};

module.exports = config;
```

Name the file `watcherConfig.js` to make the module autoload it, or name it whatever you want and pass the path as an argument.

### Locally installed
Require and use it.
```javascript
var watcher = require('node-watch-changes');

watcher(); // The module uses watcherConfig.js
watcher('myConfig.js'); // The module uses myConfig.js
```

### Globally installed
Call it from the terminal using `watcher` to use watcherConfig.js as the configuration file or `watcher myConfig.js` to use myConfig.js as the configuration file.
