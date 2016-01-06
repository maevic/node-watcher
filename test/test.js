'use strict';

process.env.testing = true;

var expect = require('chai').expect;
var watcher = require('../lib/watcher').test;

describe('Command parsing', function() {
    var parsedCommand = watcher.parseCommand('pm2 logs');

    it('should return an object', function() {
        expect(parsedCommand).is.object;
    });

    it('the command string should be equal to »pm2«', function() {
        expect(parsedCommand.command).is.a('string').and.equal('pm2');
    });

    it('the remainingString should equal » logs«', function() {
        expect(parsedCommand.remainingString).is.a('string').which.equal(' logs');
    });
});
