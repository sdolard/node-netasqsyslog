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
* EDIRNOTFOUND: Directory do not exists
*/
SyslogWriter = function (config) { // ctor 
	var 
	me = this,
	exception;
	config = config || {};
	this.verbose = config.verbose || false;
	this.directory = config.directory; // test is delegate to LogFile
	this.maxSize = config.maxSize || defaultFileMaxSize;
	
	this._logFiles = {}; // LogFiles
	this._writtenCount = 0;
	
	this._createSyslogParser();
	
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
* @private
*/
SyslogWriter.prototype._createSyslogParser = function() {
	var 
	me = this;
	
	this._syslogParser = syslogparser.create();
	
	this._syslogParser.on('done', function(data) {			
			if (!me._logFiles.hasOwnProperty(data.logType)) {
				try {
					var logFile = logfile.create({
							directory: me.directory,
							fileName: 'l_' + data.logType
					});
				} catch(exception) {
					me.emit('error', exception);
					return;
				}
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
				logFile.on('error', function(exception) {
						me.emit('error', exception);
				});
				logFile.write(data.data + '\r\n');
			} else {
				me._logFiles[data.logType].write(data.data + '\r\n');
			}
	});
	
	this._syslogParser.on('error', function(exception) {
			me.emit('error', exception);
	});
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

/**
* @private
*/
SyslogWriter.prototype._eexception = function(exception) {
	this.log('%s: "%s"', exception.code, exception.message);
	this.emit('error', exception);
};


/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) { return new SyslogWriter(config); };
