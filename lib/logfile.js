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

/**
*Known issues:
*	- When writting, deleting log file do not throw any error.
*/
// TODO LogFileIndex
var 
path = require('path'),
fs = require('fs'),
EventEmitter = require('events').EventEmitter,
util = require('util');


function onTimeout(logFile, origin) {
	if (origin === 'timeout') {
			logFile._timeoutId = -1;
	}
	var buffer = logFile._buffers.shift();
	if (!buffer) {
		logFile.emit('written', logFile.filePath);
		logFile._waitDrain = false; // No more buffer to write, timer can restart
		return;
	}
	logFile._writableStream.write(buffer.b.slice(0, buffer.usedBytes));
	if (!logFile._waitDrain) {
		logFile.emit('writting', logFile.filePath);
		logFile._waitDrain = true; // Timer has not to run
	}
}

/**
* @class
* @params config.fileName {string} 
* @params config.directory {string} 
* @params [config.verbose {boolean}]
* @event error({object} exception)
* @event writting({string} filePath)
* @event written({string} filePath)
* @throw EEMPTYFILENAME
* @throw EDIRNOTFOUND
*/
var LogFile = function (config){ // ctor
	var 
	me = this;	
	
	config = config || {};
	
	// Config
	this.fileName = config.fileName || '';
	if (this.fileName === '') {
		throw {
			code: 'EEMPTYFILENAME',
			message: 'fileName config must be set'
		};
	}
	
	this.directory = config.directory || '';
	if (this.directory === '') {
		throw {
			code: 'EEMPTYDIRECTORY',
			message: 'directory config must be set'
		};
	}
	this.directory = path.resolve(config.directory);	
	// Directory sync test
	if (!path.existsSync(this.directory)) {
		throw {
			code: 'EDIRNOTFOUND',
			message: 'Directory not found: "' + this.directory + '"'
		};
	}
	this.filePath = this.directory + '/' + this.fileName;
	this.writeDelay = config.writeDelay || 200; // ms 
	this.bufferSize = config.bufferSize || 65536; // bytes
	this.verbose = config.verbose || false;
	
	this._buffers = [];
	this._timeoutId = -1;
	this._waitDrain = false;

	
	this._createWriteStream();
	
	EventEmitter.call(this);
	
};
util.inherits(LogFile, EventEmitter);


/**
* @private
*/
LogFile.prototype._createWriteStream = function() {
	var 
	me = this;
	if (this._writableStream) {
		return;
	}
	
	this.log('Log will be written in "%s"', this.filePath);
	
	//Writable stream
	this._writableStream = fs.createWriteStream(this.filePath, {
			flags: 'a'
	}); 
	
    // Emitted on error with the exception exception.	
	this._writableStream.on('error', function(exception) {
			me.emit('error', exception);
	});
	
	// Emitted when the underlying file descriptor has been closed.	
	this._writableStream.on('close', function() {
			me.log('SyslogWriter writableStream close');
	});
	
	
	// Emitted after a write() method was called that returned false to indicate that it is safe to write again.
	this._writableStream.on('drain', function() {
			onTimeout(me, 'drain'); // we write next buffer, if there is
	});
};

/**
* @private
*/
function write(logFile, string) {
	var 
	stringLength = Buffer.byteLength(string),
	buffer = logFile._getBuffer();
	
	// Enought place in current buffer?
	if (buffer.usedBytes + stringLength > logFile.bufferSize) { 
		buffer = logFile._addBuffer();
	}
	
	buffer.b.write(string, buffer.usedBytes);
	buffer.usedBytes += stringLength;
	
	logFile._restartTimeout();
}

/**
* @public
*/
LogFile.prototype.write = function(string) {
	var 
	me = this;
	process.nextTick(function(){
			write(me, string);
	});
};

/**
* @public
*/
LogFile.prototype.writeSync = function(string) {
	write(this, string);
};




/**
* @private
*/
LogFile.prototype._getBuffer = function() {
	if (this._buffers.length === 0) {
		return this._addBuffer();
	}
	return this._buffers[this._buffers.length - 1];
};



/**
* @private
*/
LogFile.prototype._addBuffer = function() {
	var b = {
		b: new Buffer(this.bufferSize),
		usedBytes: 0
	};
	this._buffers.push(b);
	return b;
};

/**
*
*/
LogFile.prototype._restartTimeout = function() {
	if (this._waitDrain || this._timeoutId !== -1) {
		return;
	}
	clearTimeout(this._timeoutId);
	this._timeoutId = setTimeout(onTimeout, this.writeDelay, this, 'timeout');
};


/** 
* Log only if verbose is positive
* @public
* @method
*/
LogFile.prototype.log = function() {
	if (!this.verbose) {
		return;
	}
	var 
	args = arguments,
	v = 'verbose LogFile ' + this.logType +'# ';
	args[0] = args[0].replace('\n', '\n' + v);
	args[0] = v.concat(args[0]);
	console.error.apply(console, args);
};


/**
* @private
*/
LogFile.prototype._eexception = function(exception) {
	this.log('%s: "%s"', exception.code, exception.message);
	this.emit('error', exception);
};

/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) { return new LogFile(config); };

