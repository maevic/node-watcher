'use strict';

process.env.testing = true;

var expect = require('chai').expect;
var watcher = require('../lib/node-watcher').test;

describe('Command parsing', function() {
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
