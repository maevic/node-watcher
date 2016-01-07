'use strict';

process.env.testing = true;

var expect = require('chai').expect;
var watcher = require('../lib/watcher').test;

describe('Command parsing', function() {
    describe('parseCommands(pm2 startOrRestart test.json && pm2 logs; pm2 kill)', function() {
        var parsedCommands = watcher.parseCommands('pm2 startOrRestart test.json && pm2 logs; pm2 kill');

        it('should return an array', function() {
            expect(parsedCommands).is.an('array');
        });

        describe('the contents of it should be', function() {
            it('[0] === { command: pm2, arguments: [ startOrRestart, test.json ] }', function() {
                expect(parsedCommands[0].command).to.equal('pm2');
                expect(parsedCommands[0].arguments).to.have.all.members(['startOrRestart', 'test.json']);
            });

            it('[1] === { command: pm2, arguments: [ logs ] }', function() {
                expect(parsedCommands[1].command).to.equal('pm2');
                expect(parsedCommands[1].arguments).to.have.all.members(['logs']);
            });

            it('[2] === { command: pm2, arguments: [ kill ] }', function() {
                expect(parsedCommands[2].command).to.equal('pm2');
                expect(parsedCommands[2].arguments).to.have.all.members(['kill']);
            });
        });
    });

    describe('parseCommand(pm2 logs)', function() {
        var parsedCommand = watcher.parseCommand('pm2 logs');

        it('should return an object', function() {
            expect(parsedCommand).is.an('object');
        });

        it('the command string should be equal to »pm2«', function() {
            expect(parsedCommand.command).is.a('string').and.equal('pm2');
        });

        it('the arguments should be [ \'logs\' ]', function() {
            expect(parsedCommand.arguments).is.an('array').which.have.all.members(['logs']);
        });

        it('the remainingString should equal »«', function() {
            expect(parsedCommand.remainingString).is.a('string').which.equal('');
        });
    });
});
