#!/usr/bin/env node
/*
Copyright © 2011 by Sebastien Dolard (sdolard@gmail.com)


Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*/

var 
/**
* requirements
*/
util = require('util'),
getopt = require('posix-getopt'), // contrib
libSyslog = require('../lib/syslog'),
optParser, opt, syslog, 
config = {};

/**
* Uncaught exception 
*/
process.on('uncaughtException', function (exception) {
		console.error('Process uncaught exception: ', exception.message);
});


/**
* Display help
*/
function displayHelp() {
	console.log('nnsyslog –a address -d directory [-p port] [–v] [–h] [–6]');
	console.log('NETASQ Node Syslog %s', libSyslog.version);
	console.log('Options:');
	console.log('  v: enable verbose');
	console.log('  h: display this help');
	console.log('  a: firewall address');
	console.log('  d: log directory');
	console.log('  p: port');
	console.log('  6: Ip V6');
	console.log('Issues: %s', libSyslog.bugs.web);
}

/**
* Command line options
*/
optParser = new getopt.BasicParser(':hv6a:p:r:d:', process.argv);
while ((opt = optParser.getopt()) !== undefined && !opt.error) {
	switch(opt.option) {
	case 'v': // verbose
		config.verbose = true;
		break;
		
	case 'h': // help
		displayHelp();
		return;
		
	case 'a': // srcAddress
		config.srcAddress = opt.optarg;
		break;
		
	case 'd': // log directory
		config.directory = opt.optarg;
		break;
		
	case 'p': // port
		config.port = opt.optarg;
		break;
		
	case '6': // Ip V6
		config.ipv6 = opt.optarg;
		break;
		
	default:
		console.log('Invalid or incomplete option');
		displayHelp();
		return;
	}
}

if(!config.srcAddress) {
	console.log('A firewall address is mandatory!');
	displayHelp();
	process.exit(1);
}


if(!config.directory) {
	console.log('A directory is mandatory!');
	displayHelp();
	process.exit(1);
}


/**
* Verbose mode
*/
if (config.verbose) {
	console.log('Verbose enabled');
}

syslog = libSyslog.create(config);

syslog.on('error', function(exception) {
		if (exception.code === "EACCESS") {
			console.log('%s (%s)', exception.message, exception.code);
			process.exit(1);
		}
});

syslog.start();
