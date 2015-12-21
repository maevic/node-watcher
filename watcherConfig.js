module.exports = {
    directory: '.', // The directory which will be watched. If falsy, the current working directory will be watched.
    ignore: [ // ignore can be a string, regex, function or an array containing any of them. Has to be anymatch compatible, see https://github.com/es128/anymatch
        /node_modules/,
        /\.git/
    ],
    delay: 1000,
    commandsOnStart: [{
        name: 'sass',
        command: 'sass --watch .:.'
    }],
    commandsOnChange: [{ // command can be a string or a callback function returning a string. The callback gets the arguments »event, file«.
        name: 'rsync',
        command: 'rsync -aP --delete source/ target'
    }]
};
