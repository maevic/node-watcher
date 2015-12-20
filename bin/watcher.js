#!/bin/env node

var watcher = require('../lib/watcher.js');

var configPath = process.argv[2];
watcher(configPath);
