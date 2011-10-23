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

/*
Numerical             Facility
Code

0             kernel messages
1             user-level messages
2             mail system
3             system daemons
4             security/authorization messages (note 1)

5             messages generated internally by syslogd
6             line printer subsystem
7             network news subsystem
8             UUCP subsystem
9             clock daemon (note 2)
10             security/authorization messages (note 1)
11             FTP daemon
12             NTP subsystem
13             log audit (note 1)
14             log alert (note 1)
15             clock daemon (note 2)
16             local use 0  (local0)
17             local use 1  (local1)
18             local use 2  (local2)
19             local use 3  (local3)
20             local use 4  (local4)
21             local use 5  (local5)
22             local use 6  (local6)
23             local use 7  (local7)


Numerical         Severity
Code

0       Emergency: system is unusable
1       Alert: action must be taken immediately
2       Critical: critical conditions
3       Error: error conditions
4       Warning: warning conditions
5       Notice: normal but significant condition
6       Informational: informational messages
7       Debug: debug-level messages
*/

var 
EventEmitter = require('events').EventEmitter,
util = require('util'),

/**
* Private
* Priority and log type capture
*/
reCapture = /^<(.*)>.*logtype="(.*)"\r\n/,

/**
* @public
* @event 'done'
* @inherits EventEmitter
*/
SyslogParser = function (config) {  // ctor
	config = config || {};
	this.verbose = config.verbose || false;
	EventEmitter.call(this);
};
util.inherits(SyslogParser, EventEmitter); // http://nodejs.org/docs/latest/api/util.html#util.inherits


/** 
* Log only if verbose is positive
* @public
* @method
*/
SyslogParser.prototype.log = function() {
	if (!this.verbose) {
		return;
	}
	var 
	args = arguments,
	v = 'verbose# ';
	args[0] = args[0].replace('\n', '\n' + v);
	args[0] = v.concat(args[0]);
	console.error.apply(console, args);
};

/**
* @private
*/
SyslogParser.prototype._eexception = function(exception) {
	this.log('%s: "%s"', exception.code, exception.message);
	this.emit('error', exception);
};

/** 
* Log only if verbose is positive
* @public
* @method
* @params {string} string
*/
SyslogParser.prototype.parse = function(string) {
	var 
	me = this;
	string = string || '';
	if (string.length === 0) {
		this._eexception({
				code: 'EEMPTYDATA',
				message: 'Data is empty'
		});
		return;
	}
	process.nextTick(function () {
			var
			priority,
			data = {},
			capture = string.match(reCapture);
			
			if (capture === null || capture.length !== 3) {
				me._eexception({
						code: 'EINVALIDDATA',
						message: 'Invalid data: "' + string + '"'
				});
				return;
			}
			// Priority 
			// Facility = Priority / 8
			// Severity = Priority % 8	
			priority = parseInt(capture[1], 10);
			data.facility = Math.floor(priority / 8);
			data.severity = priority % 8;
			
			// Log type
			data.logType = capture[2];
			data.data = string.substring(2 + capture[1].length, string.length - 13 - data.logType.length);
			me.emit('done', data);
	});
};


/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) { return new SyslogParser(config); };
