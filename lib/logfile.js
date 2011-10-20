// TODO LogFileIndex
var 
path = require('path'),
fs = require('fs'),
EventEmitter = require('events').EventEmitter,
util = require('util');

function onTimeout(logFile) {
	var buffer = logFile.buffers.shift();
	if (!buffer) {
		logFile.emit('written', logFile.fileName);
		logFile.waitDrain = false; // No more buffer to write, timer can restart
		return;
	}

	logFile.writableStream.write(buffer.b.slice(0, buffer.usedBytes));
	if (!logFile.waitDrain) {
		logFile.emit('writting', logFile.fileName);
		logFile.waitDrain = true; // Timer has not to run
	}
}

/**
* @class
* @params config.logType {string} 
* @params config.directory {string} 
* @params config.verbose {boolean} 
*/
var LogFile = function (config){
	var me = this;	
	// Config
	this.logType = config.logType;
	if (!this.logType || this.logType === '') {
		throw {
			code: 'EINVALIDLOGTYPE',
			message: 'Invalid log type'
		};
	}
	this.directory = path.resolve(config.directory);	
	// Directory sync test
	if (!path.existsSync(this.directory)) {
		this.log('EDIRNOTFOUND: "%s"', this.directory);
		throw {
			code: 'EDIRNOTFOUND',
			message: 'Directory do not exists: "' + this.directory + '"'
		};
	}
	this.writeDelay = config.writeDelay || 200; // ms 
	this.bufferSize = config.bufferSize || 65536; // bytes
	this.buffers = [];
	this.timeoutId = -1;
	this.verbose = config.verbose || false;
	this.waitDrain = false;
	this.log('Log will be written in "%s/l_%s"', this.directory, this.logType);
	
	this.fileName = this.directory + '/l_'+ this.logType;
	
	//Writable stream
	this.writableStream = fs.createWriteStream(this.fileName, {
			flags: 'a'
	}); 
	
    // Emitted on error with the exception exception.	
	this.writableStream.on('error', function(exception) {
			me.log('SyslogWriter writableStream error: %s (%s)', exception.message, exception.code);
			throw exception;
	});
	
	// Emitted when the underlying file descriptor has been closed.	
	this.writableStream.on('close', function(exception) {
			me.log('SyslogWriter writableStream close');
	});
	
	
	// Emitted after a write() method was called that returned false to indicate that it is safe to write again.
	this.writableStream.on('drain', function() {
			onTimeout(me); // we write next buffer, if there is
	});
	
	EventEmitter.call(this);
};
util.inherits(LogFile, EventEmitter);


/**
* @public
*/
LogFile.prototype.write = function(string) {
	var 
	stringLength = Buffer.byteLength(string),
	buffer = this._currentBuffer();
	
	// Enought place in current buffer?
	if (buffer.usedBytes + stringLength > this.bufferSize) { 
		buffer = this._addBuffer();
	}
	
	buffer.b.write(string, buffer.usedBytes);
	buffer.usedBytes += stringLength;
	
	this._restartTimeout();
};


/**
* @private
*/
LogFile.prototype._currentBuffer = function() {
	if (this.buffers.length === 0) {
		return this._addBuffer();
	}
	return this.buffers[this.buffers.length - 1];
};

/**
* @private
*/
LogFile.prototype._addBuffer = function() {
	var b = {
			b: new Buffer(this.bufferSize),
			usedBytes: 0
	};
	this.buffers.push(b);
	return b;
};

/**
*
*/
LogFile.prototype._restartTimeout = function() {
	if (this.waitDrain) {
		return;
	}
	clearTimeout(this.timeoutId);
	this.timeoutId = setTimeout(onTimeout, this.writeDelay, this);
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

/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) { return new LogFile(config); };

