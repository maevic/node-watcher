# Node Watcher

Run user defined commands on file changes.

## Installation
`npm install node-watch-changes`  
`npm install -g node-watch-changes`

## Usage
Create a configuration file in the fashion of the following example.

```javascript
// Define the callbacks. Available are onStart, onChange and onEnd. They all get a spawn parameter, which is a promisified version of node's child_process.spawn. The onChange callback additionally gets an events object.

const onStart = (spawn) => {
	console.log('Watcher is running...');
};

const onChange = async (events, spawn) => {
	if (events.change) {
		await spawn('npm run sass');
		await spawn('rsync -aP --delete --exclude "node_modules" "./" "server:/path/to/destination"');
	}
};

const onEnd = (spawn) => {
	console.log('Watcher is terminating.');
};

var config = {
	directory: '.', // The directory which will be watched for changes. If falsy, the parent directory of this module will be watched. Can be a string or an array of strings.
	ignore: [ // ignore can be a string, regex, function or an array containing any of them. Has to be anymatch compatible, see https://github.com/es128/anymatch
		/node_modules/,
		/\.git/
	],
	delay: 400, // Delay the execution of the commands on change in ms
	verbosity: 'normal', // Possible values are: minimal, normal, verbose
	onStart: onStart,
	onChange: onChange,
	onEnd: onEnd
};

module.exports = config;
```

Name the file `.watcher-config.js` to make the module autoload it, or name it whatever you want and pass the path as an argument.

### Locally installed
Require and use it.
```javascript
var watcher = require('node-watch-changes');

watcher(); // The module uses watcherConfig.js
watcher('myConfig.js'); // The module uses myConfig.js
```

### Globally installed
Call it from the terminal using `watcher` to use watcherConfig.js as the configuration file or `watcher myConfig.js` to use myConfig.js as the configuration file.
