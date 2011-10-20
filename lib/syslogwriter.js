/*
firewall log format
"l_" + "log name" + '8 chars log number' + 'start date' + 'end date' + 'line number'
Ex: l_connection_00000000_20100831170814_20100915012956_12545
2010 08 31 17 08 14 
2010 09 15 01 29 56
5Mo max
*/
var 
path = require('path'),
EventEmitter = require('events').EventEmitter,
util = require('util'),
syslogparser = require('./syslogparser'),
logfile = require('./logfile'),
defaultFileMaxSize= 1024 * 1024 * 5, // 5MB

/**
* @public
* @throw {
*   code{string} 
*   message{string}
* }
* Exceptions
* EDIRNOTFOUND: Directory do not exists
*/
SyslogWriter = function (config) { // ctor 
	var 
	me = this;
	config = config || {};
	this.verbose = config.verbose || false;
	this.directory = path.resolve(config.directory);
	this.maxSize = config.maxSize || defaultFileMaxSize;
	
	this._logFiles = {}; // LogFiles
	this._writtenCount = 0;
	
	// Directory sync test
	if (!path.existsSync(this.directory)) {
		this.log('EDIRNOTFOUND: "%s"', this.directory);
		throw {
			code: 'EDIRNOTFOUND',
			message: 'Directory do not exists: "' + this.directory + '"'
		};
	} else {
		this.log('Log will be written in "%s"', this.directory);
	}
	
	// syslogparser
	this._syslogParser = syslogparser.create();
	this._syslogParser.on('done', function(data) {
			/*
			data = {
			facility: -1,
			severity: -1,
			logType: '',
			data: ''
			};
			*/
			if (data.facility === -1) {
				me.log('SyslogWriter.prototype._write: data.facility eq -1');
				return;
			}
			if (data.severity === -1) {
				me.log('SyslogWriter.prototype._write: data.severity eq -1');
				return;
			}
			if (data.logType === '') {
				me.log('SyslogWriter.prototype._write: data.logType is empty');
				return;
			}
			if (data.data === '') {
				me.log('SyslogWriter.prototype._write: data.data is empty');
				return;
			}
			me.log('%s: %s', data.logType, data.data);
			
			
			if (!me._logFiles.hasOwnProperty(data.logType)) {
				var logFile = logfile.create({
						directory: me.directory,
						logType: data.logType
				});
				me._logFiles[data.logType] = logFile;
				logFile.on('writting', function(fileName) {
						if (me._writtenCount === 0) {
							me.emit('writting');
						}
						me._writtenCount++; 
				});
				logFile.on('written', function(fileName) {
						me._writtenCount--;
						if (me._writtenCount < 0) { // This should not occured
							me.log('me._writtenCount < 0'); 
						}
						if (me._writtenCount === 0) {
							me.emit('written');
						}
				});
			}
			me._logFiles[data.logType].write(data.data + '\r\n');
	});
	
	EventEmitter.call(this);
};
util.inherits(SyslogWriter, EventEmitter);

/**
* @public
* @params {string} syslog line
*/
SyslogWriter.prototype.write = function(string) {
	this._syslogParser.parse(string);
};


/** 
* Log only if verbose is positive
* @public
* @method
*/
SyslogWriter.prototype.log = function() {
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


/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) { return new SyslogWriter(config); };
