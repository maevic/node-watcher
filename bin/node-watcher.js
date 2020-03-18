#!/usr/bin/env node

var watcher = require('../lib/node-watcher.js');

var configPath = process.argv[2];
watcher(configPath);
