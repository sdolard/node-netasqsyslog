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

Data example
<134>id=firewall time="2011-10-13 13:11:39" fw="fw_ihm" tz=+0200 startime="2011-10-13 13:09:38" 
pri=5 confid=01 slotlevel=2 ruleid=3 
srcif="Ethernet1" srcifname="in" ipproto=udp dstif="Ethernet0" dstifname="out" 
proto=dns src=10.2.52.1 srcport=55765 srcportname=ephemeral_fw_udp dst=10.0.0.124 
dstport=53 dstportname=domain_udp dstname=jupiter.netasq.com modsrc=10.2.52.1 
modsrcport=55765 origdst=10.0.0.124 origdstport=53 sent=50 rcvd=89 duration=0.00 
logtype="connection"\r\n
*/

var 
EventEmitter = require('events').EventEmitter,
util = require('util'),

/**
* Private
* Priority and log type capture
*/
reCapture = /^<(\d*)>.* time="(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})" .* logtype="(.*)"\r\n/,
reLogCapture = /^<\d*>(.*) logtype=".*"\r\n/,
//reLogCapture = /^<\d*>(.*)\r\n/,
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
	var error;
	if (exception instanceof Error) {
		error = exception;
	} else {
		error = new Error(exception.message);
		Error.captureStackTrace(error, SyslogParser.prototype._eexception); // we do not trace this function
		error.code = exception.code;
	}
	
	this.emit('error', error);
	if (this.verbose) {
		console.log(error.stack);
	}
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
			year,
			month,
			day, 
			hour,
			min,
			sec,
			data = {},
			capture = string.match(reCapture);
			
			if (capture === null) {
				me._eexception({
						code: 'EINVALIDDATA',
						message: 'Invalid data: "' + string + '"',
						data: string
				});
				return;
			}
			
			if (capture.length !== 9) { // For dev
				me._eexception({
						code: 'EINVALIDCAPTURELENGTH',
						message: 'Invalid capture length. (' + capture.length + ': excpected 9)',
						data: string
				});
				return;
			}
			
			
			// Priority 
			priority = parseInt(capture[1], 10);
			
			// Facility = Priority / 8
			data.facility = Math.floor(priority / 8);
			
			// Severity = Priority % 8	
			data.severity = priority % 8;
			
			// date
			year = capture[2];
			month = parseInt(capture[3], 10) - 1; // Jan = 0
			day = capture[4];
			hour = capture[5];
			min = capture[6];
			sec = capture[7];
			data.date = new Date(year, month, day, hour, min, sec); 
			
			// Log type
			data.logType = capture[8];
			
			// log data
			capture = string.match(reLogCapture);
			if (capture.length !== 2) { // For dev
				me._eexception({
						code: 'EINVALIDCAPTURELENGTH',
						message: 'Invalid capture length. (' + capture.length + ': excpected 2)',
						data: string
				});
				return;
			}
			data.log = capture[1];
			
			me.emit('data', data);
	});
};



/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) { return new SyslogParser(config); };
