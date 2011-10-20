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
* Log only if verbose is positive
* @public
* @method
* @params {string} string
*/
SyslogParser.prototype.parse = function(string) {
	var 
	me = this,
	data = {
		facility: -1,
		severity: -1,
		logType: '',
		data: ''
	};
	string = string || '';
	if (string.length === 0) {
		this.log('SyslogParser.prototype.parse: string is empty');
		me.emit('done', data);
		return;
	}
	process.nextTick(function () {
			var
			priority,
			capture = string.match(reCapture),
			from;
			
			if (capture === null || capture.length !== 3) {
				me.emit('done', data);
				return;
			}
			// Priority 
			// Facility = Priority / 8
			// Severity = Priority % 8	
			priority = parseInt(capture[1], 10);
			from = 2 + capture[1].length;
			data.facility = Math.floor(priority / 8);
			data.severity = priority % 8;
			
			// Log type
			data.logType = capture[2];
			data.data = string.substring(from, string.length - 13 - data.logType.length);
			me.emit('done', data);
	});
};


/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) { return new SyslogParser(config); };
