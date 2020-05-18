var spawn = require('child_process').spawn;
var path = require('path');
var chokidarLib = require('chokidar');
var colors = require('colors/safe');
var configPath = '';
var chokidar = null;
var config = {};

RegExp.prototype.toJSON = RegExp.prototype.toString;
Function.prototype.toJSON = function() {
	return this.toString().replace(/\n/g, '');
};

var watcher = function(initialConfig) {
	var noConfigFound = false;

	initialConfig = initialConfig || path.resolve(process.cwd(), '.watcher-config.js');

	if (initialConfig.constructor === String) {
		var resolvedPath = path.resolve(initialConfig);
		configPath = resolvedPath;

		try {
			config = require(resolvedPath);
		} catch (e) {
			config = {};
			configPath = '';
			noConfigFound = true;
		}
	} else {
		config = initialConfig;
	}

	ensureConfigValues();

	if (noConfigFound) {
		console.log(colors.yellow('Couldn\'t find the config file »' + resolvedPath + '«. Will use default values.'));
		console.log(colors.yellow('Default config values are:'));
		console.log(JSON.stringify(config, null, 2));
		console.log();
	} else {
		if (config.verbosity >= verbosity.normal) {
			console.log(colors.green('Using following config (' + configPath + '):'));
			console.log(JSON.stringify(config, null, 2));
			console.log();
		}
	}

	if (config.onStart) {
		try {
			config.onStart.call(null, spawnPromisified);
		} catch(error) {
			console.log(colors.red('The onStart callback threw an error.', error));
		}
	}

	setupCommandsOnChange();

	process.on('SIGTERM', function() {
		if (chokidar) {
			chokidar.close();
		}

		if (config.onEnd) {
			try {
				config.onEnd.call(null, spawnPromisified);
			} catch(error) {
				console.log(colors.red('The onEnd callback threw an error.', error));
			}
		}
	});

};

var ensureConfigValues = function() {
	config.directory = config.directory || process.cwd();
	config.delay = config.delay || 1000;
	config.ignore = config.ignore || [];
	config.verbosity = config.verbosity || 'normal';
	config.verbosity = verbosity[config.verbosity];
	config.onStart = config.onStart || function() {};
	config.onChange = config.onChange || function() {};
	config.onEnd = config.onEnd || function() {};
};

var setupCommandsOnChange = function() {
	var timeoutID = 0;
	var allEvents = {};

	if (config.onChange) {
		var directoryToWatch = null;

		if (config.directory.constructor === String) {
			directoryToWatch = config.directory.indexOf('/') !== 0 ? path.resolve(process.cwd(), config.directory) : config.directory;
		} else if (config.directory.constructor === Array) {
			directoryToWatch = [];

			for (var i = 0; i < config.directory.length; i++) {
				var directory = config.directory[i];

				directoryToWatch.push(directory.indexOf('/') !== 0 ? path.resolve(process.cwd(), directory) : directory);
			}
		}

		chokidar = chokidarLib.watch(directoryToWatch, {
			ignoreInitial: true,
			ignored: config.ignore
		});

		chokidar.on('all', function(event, path) {
			clearTimeout(timeoutID);
			if (!allEvents[event]) {
				allEvents[event] = [];
			}

			allEvents[event].push(path);

			if (configPath && event === 'change' && configPath === path) { // The config file changed
				delete require.cache[configPath];
				config = require(configPath);
				ensureConfigValues();

				if (config.verbosity >= verbosity.normal) {
					console.log(colors.green('Config file changed, reloaded it. The new values are:'));
					console.log(JSON.stringify(config, null, 2));
					console.log();
				}

				allEvents = {};
				return;
			}

			timeoutID = setTimeout(function() {
				if (config.verbosity >= verbosity.verbose) {
					console.log(colors.green('Executing callbacks for the following events:'));
					console.log(JSON.stringify(allEvents, null, 2));
					console.log();
				}

				try {
					config.onChange.call(null, allEvents, spawnPromisified);
				} catch(error) {
					console.log(colors.red('The onChange callback threw an error.', error));
				}

				allEvents = {};
			}, config.delay);
		});
	}
};

const spawnPromisified = function(command, args) {
	return new Promise(function(resolve, reject) {
		if (config.verbosity >= verbosity.normal) {
			console.log(colors.green('Spawning the command') + ' "' + command + '" ' + colors.green('with the arguments ') + JSON.stringify(args));
			console.log();
		}

		if (!args) {
			// No args are being passed in, so we parse the command string
			var parsedCommand = parseCommand(command);

			command = parsedCommand.command;
			args = parsedCommand.arguments;
		}

		child = spawn(command, args, {
			stdio: 'inherit'
		});

		var onExit = function(code) {
			if (code !== 0) {
				reject(code);
			} else {
				if (config.verbosity >= verbosity.normal) {
					console.log(colors.green('The command') + ' "' + command + '" ' + colors.green('with arguments ') + JSON.stringify(args) + colors.green(' exited'));
					console.log();
				}

				resolve();
			}
		};

		const onError = function(error) {
			if (config.verbosity >= verbosity.normal) {
				console.log(colors.red('The command') + ' "' + command + '" ' + colors.red('with arguments ') + JSON.stringify(args) + colors.red(' errored'));
				console.log();
			}

			reject(error);
		};

		child.on('error', onError);
		child.on('exit', onExit);
		child.on('SIGTERM', onExit);
		child.on('SIGINT', onExit);
	});
};

var parseCommand = function(command) {
	var quoted = false;
	var parsedCommand = {
		command: '',
		arguments: [],
		remainingString: ''
	};

	if (!command) {
		return parsedCommand;
	}

	var checkForArguments = function() {
		var remainingString = command.replace(parsedCommand.command, '').trim();

		if (remainingString.indexOf(';') === 0) {
			parsedCommand.remainingString = remainingString.substring(1).trim();
			return parsedCommand;
		}

		var parsedArguments = parseArguments(remainingString);

		parsedCommand.arguments = parsedArguments.arguments;
		parsedCommand.remainingString = parsedArguments.remainingString;

		return parsedCommand;
	};

	for (var i = 0; i < command.length; i++) {
		var char = command.charAt(i);
		var previousChar = i > 0 ? command.charAt(i - 1) : '';

		if (char === ' ') {
			if (quoted || previousChar === '\\') {
				parsedCommand.command += char;
			} else {
				return checkForArguments();
			}
		} else if (previousChar !== '\\' && (char === '"' || char === '\'')) {
			if (quoted) {
				return checkForArguments();
			}

			quoted = true;
		} else if (char === ';' && !quoted) {
			return checkForArguments();
		} else if (char === '&' && previousChar === '&' && !quoted) {
			return checkForArguments();
		} else {
			parsedCommand.command += char;
		}
	}

	return checkForArguments();
};

var parseArguments = function(arguments) {
	var quoted = false;
	var parentheses = 0;
	var brackets = 0;
	var braces = 0;
	var parsedArguments = {
		arguments: [],
		remainingString: ''
	};

	if (!arguments) {
		return parsedArguments;
	}

	var currentArgument = '';

	var addArgument = function() {
		currentArgument = currentArgument.trim();

		if (currentArgument.indexOf('"') === 0 && currentArgument.match(/"$/)) {
			currentArgument = currentArgument.substring(1, currentArgument.length - 1);
		}

		if (currentArgument !== '' && currentArgument !== '&') {
			parsedArguments.arguments.push(currentArgument);
		}

		currentArgument = '';
		quoted = false;
		var parentheses = 0;
		var brackets = 0;
		var braces = 0;
	};

	for (var i = 0; i < arguments.length; i++) {
		var char = arguments[i];
		var previousChar = i > 0 ? arguments.charAt(i - 1) : '';

		if (char === ' ') {
			if (quoted || previousChar === '\\') {
				currentArgument += char;
			} else {
				addArgument();
			}
		} else if (previousChar !== '\\' && (char === '"' || char === '\'')) {
			currentArgument += char;

			if (quoted && !parentheses && !brackets && !braces) {
				addArgument();
			} else if (quoted) {
				quoted = false;
			} else {
				quoted = true;
			}
		} else if (char === '(') {
			currentArgument += char;
			parentheses++;

		} else if (char === ')') {
			currentArgument += char;
			parentheses--;

			if (!parentheses && !brackets && !braces && !quoted) {
				addArgument();
			}
		} else if (char === '[') {
			currentArgument += char;
			brackets++;
		} else if (char === ']') {
			currentArgument += char;
			brackets--;

			if (!parentheses && !brackets && !braces && !quoted) {
				addArgument();
			}
		} else if (char === '{') {
			currentArgument += char;
			braces++;
		} else if (char === '}') {
			currentArgument += char;
			braces--;

			if (!parentheses && !brackets && !braces && !quoted) {
				addArgument();
			}
		} else if (char === ';') {
			if (!quoted && !parentheses && !brackets && !braces) {
				addArgument();
				parsedArguments.remainingString = arguments.substring(i + 1).trim();
				return parsedArguments;
			} else {
				currentArgument += char;
			}
		} else if (char === '&' && previousChar === '&') {
			if (!quoted && !parentheses && !brackets && !braces) {
				addArgument();
				parsedArguments.remainingString = arguments.substring(i + 1).trim();
				return parsedArguments;
			} else {
				currentArgument += char;
			}
		} else {
			currentArgument += char;
		}
	}

	if (currentArgument) {
		addArgument();
	}

	return parsedArguments;
};

var verbosity = {
	minimal: 0,
	normal: 1,
	verbose: 2
};

module.exports = watcher;

if (process.env.testing) {
	module.exports.test = {
		parseCommand: parseCommand,
		parseArguments: parseArguments,
		setupCommandsOnChange: setupCommandsOnChange,
		ensureConfigValues: ensureConfigValues
	};
}
