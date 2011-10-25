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
// TODO LogFileIndex?
var 
path = require('path'),
fs = require('fs'),
EventEmitter = require('events').EventEmitter,
util = require('util');


function onTimeout(logFile, origin) {
	if (origin === 'timeout') {
		logFile._timeoutId = -1;
	}
	if (logFile._rotationPending) {
		return;
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
	
	// File rotation
	// Should be done before write: a file could exists before writing and be 
	// bigger than fileMaxSize.
	logFile._writtenSize += buffer.usedBytes;
	if (logFile._writtenSize < logFile.fileMaxSize) {
		return;
	}
	logFile._rotationPending = true;
	logFile._writableStream.destroySoon(); // this will flush before then close
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
	this.fileMaxSize = config.fileMaxSize || 1024 * 1024 * 5; // 5MB
	this.verbose = config.verbose || false;
	
	this._buffers = [];
	this._timeoutId = -1;
	this._waitDrain = false;
	this._writtenSize = 0;
	this._rotationPending = false;
	
	
	this._createWriteStream();
	
	EventEmitter.call(this);
	
};
util.inherits(LogFile, EventEmitter);


/**
* @private
*/
LogFile.prototype._createWriteStream = function() {
	var 
	me = this,
	stats;
	if (this._writableStream) {
		return;
	}
	
	this.log('Log will be written in "%s"', this.filePath);
	
	// reset	
	this._writtenSize = 0;
	this._rotationPending = false;
	this._waitDrain = false;
	
	
	//Writable stream
	this._writableStream = fs.createWriteStream(this.filePath, {
			flags: 'a'
	}); 
	this._writableStream.on('error', function(err) {
			me._eexception.call(me, err, '_createWriteStream _writableStream on error');
	});
	
	// Emitted when the underlying file descriptor has been closed.	
	this._writableStream.on('close', function() {
			if (me._rotationPending) {
				delete me._writableStream;
				me._doFileRotation.call(me);
			}
	});
	
	
	// Emitted after a write() method was called that returned false to indicate that it is safe to write again.
	this._writableStream.on('drain', function() {
			onTimeout(me, 'drain'); // we write next buffer, if there is
	});
	
	// No(~) cost to be sync
	// Painful to be async
	try {
		stats = fs.statSync(this.filePath);
		me._writtenSize =  stats.size;
	} catch(err) {
		if (err && err.code !== 'ENOENT') {	
			this._eexception.call(this, err, '_createWriteStream fs.stat');
			return;
		}
	}
};

/**
* @private
*/
function write(logFile, string) {
	var 
	stringLength = Buffer.byteLength(string),
	buffer = logFile._getBuffer.call(logFile);
	
	// Enought place in current buffer?
	if (buffer.usedBytes + stringLength > logFile.bufferSize) { 
		buffer = logFile._addBuffer.call(logFile);
	}
	
	buffer.b.write(string, buffer.usedBytes);
	buffer.usedBytes += stringLength;
	
	logFile._restartTimeout.call(logFile);
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
*
*/
LogFile.prototype._doFileRotation = function() {
	var
	me = this,
	ms = new Date().getTime(),
	oldFilePath = this.filePath,
	extname = path.extname(this.filePath),
	basename = path.basename(this.filePath, extname),
	dirname = path.dirname(this.filePath, extname);
	filePath = dirname + '/' + basename + "_" + ms;
	if (extname !== '') {
		filePath += extname;
	}
	
	fs.rename(this.filePath, filePath, function(err) {
			if (err) {
				me._eexception.call(me, err, "_doFileRotation fs.rename");
				return;
			}
			me.emit('renamed', oldFilePath, filePath);
			
			// new stream	
			me._createWriteStream.call(me);
			
			// restart
			me._restartTimeout.call(me);
	});
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
	v = 'verbose LogFile ' + path.basename(this.filePath) +'# ';
	args[0] = args[0].replace('\n', '\n' + v);
	args[0] = v.concat(args[0]);
	console.error.apply(console, args);
};


/**
* @private
*/
LogFile.prototype._eexception = function(exception, more) {
	this.log('%s: "%s" (%s)', exception.code, exception.message, more);
	this.emit('error', exception);
};

/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) { return new LogFile(config); };

