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
    config.delay = config.delay || 1000;
    config.ignore = config.ignore || [];
    config.commandsOnStart = config.commandsOnStart || [];
    config.commandsOnChange = config.commandsOnChange || [];

    if (noConfigFound) {
        console.log('Couldn\'t find the config file »' + resolvedPath + '«. Will use default values.');
        console.log('Default config values are:');
        console.log(config);
    } else {
        console.log('Using following config:');
        console.log(config);
    }

    var timeoutID = 0;
    var allEvents = [];

    for (var index in config.commandsOnStart) {
        var command = parseCommand(config.commandsOnStart[index].command);
        var arguments = parseArguments(config.commandsOnStart[index].command);

        if (command) {
            spawn(command, arguments, {
                stdio: 'inherit'
            });
        }
    }

    if (config.commandsOnChange.length) {
        var directoryToWatch = config.directory.indexOf('/') !== 0 ? path.resolve(process.cwd(), config.directory) : config.directory;

        var watcher = chokidar.watch(directoryToWatch, {
            ignoreInitial: true,
            ignored: config.ignore
        });

        watcher.on('all', function(event, path) {
            clearTimeout(timeoutID);
            allEvents.push([event, path]);

            timeoutID = setTimeout(function() {
                console.log(allEvents);

                for (var index in config.commandsOnChange) {
                    var commandString;

                    if (config.commandsOnChange[index].command.constructor === String) {
                        var command = parseCommand(config.commandsOnChange[index].command);
                        var arguments = parseArguments(config.commandsOnChange[index].command);

                        if (command) {
                            spawn(command, arguments, {
                                stdio: 'inherit'
                            });
                        }
                    } else if (config.commandsOnChange[index].command.constructor === Function) {
                        for (var i = 0; i < allEvents.length; i++) {
                            var event = allEvents[i][0];
                            var file = allEvents[i][1];
                            var callbackResult = config.commandsOnChange[index].command(event, file);

                            var command = parseCommand(callbackResult);
                            var arguments = parseArguments(callbackResult);

                            if (command) {
                                spawn(command, arguments, {
                                    stdio: 'inherit'
                                });
                            }
                        }
                    }
                }

                allEvents = [];
            }, config.delay);
        });
    }
};

var parseCommand = function(command) {
    var quoted = false;
    var parsedCommand = '';

    if (!command) {
        return parsedCommand;
    }
    
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

    if (!command) {
        return parsedArguments;
    }

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
