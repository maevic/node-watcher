var watcher = function(config) {
    var path = require('path');
    var spawn = require('child_process').spawn;
    var chokidar = require('chokidar');
    var noConfigFound = false;

    if (!config) {
        config = path.resolve(process.cwd(), 'watcherConfig.js');
    }

    if (config.constructor === String) {
        var resolvedPath = path.resolve(config);

        try {
            config = require(resolvedPath);
        } catch (e) {
            config = {};
            noConfigFound = true;
        }
    }

    config.directory = config.directory || process.cwd();
    config.sass = config.sass || '';
    config.rsync = config.rsync || '';
    config.delay = config.delay || 1000;
    config.ignore = config.ignore || [];

    if (noConfigFound) {
        console.log('Couldn\'t find the config file »' + resolvedPath + '«. Will use default values.');
        console.log('Default config values are:');
        console.log(config);
    }

    var timeoutID = 0;
    var allEvents = [];

    if (config.sass) {
        var sassCommand = parseCommand(config.sass);
        var sassArguments = parseArguments(config.sass);

        var sass = spawn(sassCommand, sassArguments, {
            stdio: 'inherit'
        });
    }

    if (config.rsync) {
        var rsyncCommand = parseCommand(config.rsync);
        var rsyncArguments = parseArguments(config.rsync);

        var directoryToWatch = config.directory.indexOf('/') !== 0 ? path.resolve(process.cwd(), config.directory) : config.directory;

        var watcher = chokidar.watch(directoryToWatch, {
            ignoreInitial: true,
            ignored: config.ignore
        });

        watcher.on('all', function(event, path) {
            clearTimeout(timeoutID);
            console.log(path);
            allEvents.push([event, path]);

            timeoutID = setTimeout(function() {
                console.log(allEvents);

                if (rsyncCommand) {
                    spawn(rsyncCommand, rsyncArguments, {
                        stdio: 'inherit'
                    });
                }

                allEvents = [];
            }, config.delay);
        });
    }
};

var parseCommand = function(command) {
    var quoted = false;
    var parsedCommand = '';

    for (var i = 0; i < command.length; i++) {
        var char = command.charAt(i);
        var previousChar = i > 0 ? command.charAt(i - 1) : '';

        if (char === ' ') {
            if (quoted || previousChar === '\\') {
                parsedCommand += char;
            } else {
                return parsedCommand;
            }
        } else if (char === '"' || char === '\'') {
            if (quoted) {
                return parsedCommand;
            }

            quoted = true;
        } else {
            parsedCommand += char;
        }
    }

    return parsedCommand;
}

var parseArguments = function(command) {
    var quoted = false;
    var parsedArguments = [];
    var currentArgument = '';
    var arguments = command.replace(parseCommand(command), '').trim();

    var addArgument = function() {
        currentArgument = currentArgument.replace(/"/g, '').trim();

        if (currentArgument !== '') {
            parsedArguments.push(currentArgument);
        }

        currentArgument = '';
        quoted = false;
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
        } else if (char === '"' || char === '\'') {
            currentArgument += char;

            if (quoted) {
                addArgument();
            } else {
                quoted = true;
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

module.exports = watcher;
