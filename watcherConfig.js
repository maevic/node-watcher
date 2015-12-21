module.exports = {
    // The directory which will be watched. If falsy, the parent directory of this module will be watched.
    directory: '.',
    // ignore can be a string, regex, function or an array containing any of them. Has to be anymatch compatible, see https://github.com/es128/anymatch
    ignore: [
        /node_modules/,
        /\.git/
    ],
    delay: 1000,
    // The command to be executed to watch sass files. Leave empty to don't use sass.
    sass: 'sass --watch .:.',
    // The command to be executed when a change occurs. Leave empty to don't use rsync.
    rsync: 'rsync -aP --delete source/ target'
};
