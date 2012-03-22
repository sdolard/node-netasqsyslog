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
logtofile = require('logtofile'),
defaultFileMaxSize = 1024 * 1024 * 5, // 5MB

/**
* @public
* EDIRNOTFOUND: Directory do not exists
*/
SyslogWriter = function (config) { // ctor 
	var 
	me = this;
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
	
	this._syslogParser.on('data', function(data) {			
			if (!me._logFiles.hasOwnProperty(data.logType)) {
				try {
					var logFile = logtofile.create({
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
							me.emit('writting', fileName);
						}
						me._writtenCount++; 
				});
				logFile.on('written', function(fileName) {
						me._writtenCount--;
						if (me._writtenCount < 0) { // This should not occured
							me.log('me._writtenCount < 0'); 
						}
						if (me._writtenCount === 0) {
							me.emit('written', fileName);
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


/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) { return new SyslogWriter(config); };
