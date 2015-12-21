module.exports = {
    // The directory which will be watched. If falsy, the current working directory will be watched.
    directory: '.',
    // ignore can be a string, regex, function or an array containing any of them. Has to be anymatch compatible, see https://github.com/es128/anymatch
    ignore: [
        /node_modules/,
        /\.git/
    ],
    delay: 1000,
    commandsOnStart: [{
        name: 'sass',
        command: 'sass --watch .:.'
    }],
    commandsOnChange: [{
        name: 'rsync',
        command: 'rsync -aP --delete source/ target'
    }]
};
