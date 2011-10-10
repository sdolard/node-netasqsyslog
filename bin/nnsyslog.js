//#!/usr/bin/env node
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
netasqLog = require('../lib/log'),
getopt = require('posix-getopt'), // contrib
syslog = netasqLog.createSyslog(),
optParser, opt;


/**
* Uncaught exception 
*/
process.on('uncaughtException', function (exception) {
		if (exception.code === "EACCES") {
			process.exit(1);
		}
		console.error('Process uncaught exception: ', exception.message);
});


/**
* Display help
*/
function displayHelp() {
	console.log('nnsyslog –a address [-p port] [–v] [–h]');
	console.log('NETASQ Node Syslog.');
	console.log('Options:');
	console.log('  v: enable verbose');
	console.log('  h: display this help');
	console.log('  a: firewall address');
	console.log('  p: port');
}

/**
* Command line options
*/
optParser = new getopt.BasicParser(':hva:p:', process.argv);
while ((opt = optParser.getopt()) !== undefined && !opt.error) {
	switch(opt.option) {
	case 'v': // verbose
		syslog.verbose = true;
		break;
		
	case 'h': // help
		displayHelp();
		return;
		
	case 'a': // srcAddress
		syslog.srcAddress = opt.optarg;
		break;
		
		
	case 'p': // port
		syslog.port = opt.optarg;
		break;

		
	default:
		console.log('Invalid or incomplete option');
		displayHelp();
		return;
	}
}

/**
* Verbose mode
*/
if (syslog.verbose) {
	console.log('Verbose enabled');
}

syslog.start();