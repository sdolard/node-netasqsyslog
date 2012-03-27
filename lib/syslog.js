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
dgram = require("dgram"),
util = require('util'),
EventEmitter = require('events').EventEmitter,
pkginfo = require('pkginfo')(module, 'version'),// contrib
syslogwriter = require('./syslogwriter'),


/**
* Read NETASQ syslog
* @public
* @class
* @param config.srcAddress: {string} || [{string]] // default to any
* @param config.port: {number} // default 514
* @param config.ipv6: {boolean} // default false,
* @param config.verbose: {boolean} // default false
*/
Syslog = function(config) { // ctor
	config =  config || {};
	var 
	me = this,
	addresses;
	
	debugger;
	this.srcAddress = config.srcAddress; // {} for any
	if (typeof(this.srcAddress) === 'string') {
		addresses = this.srcAddress.split(',');
		this.srcAddress = {};
		addresses.forEach(function(val, index, array) {
				me.srcAddress[val] = true;
		})
	}
	this.port = config.port || 514;
	this.ipv6 = config.ipv6 || false;  
	this.verbose = config.verbose || false;
	
	process.nextTick(function() {
			me.start();
	});
	EventEmitter.call(this);
};
util.inherits(Syslog, EventEmitter);


/**
* @public 
* @method
*/
Syslog.prototype.stop = function() {
	if (!this._server) {
		return;
	}
	this._server.close();
	delete this._server;
};

/**
* @public
* @method
* @return bool
*/
Syslog.prototype.start = function() {
	var me = this;
	
	if (this._server) {
		return;
	}
	
	this.log('Trying to listening %s:%s...',  this.srcAddress ? this.srcAddress : "*", this.port);
	
	this._server = dgram.createSocket(this.ipv6 ? "udp6" : "udp4");
	
	this._server.on("message", function (/* Buffer */msg, rinfo) {
			var
			msgStr = msg.toString('utf8');  // crlf ends line
			
			/*
			rinfo {
			size {number},
			address {string},
			port {number}
			}
			*/
			if (me.srcAddress && !me.srcAddress[rinfo.address]) {
				me.log('Filtered message from %s', rinfo.address);
				return;
			}
			me.log('From %s: %s', rinfo.address, msgStr.substr(0, msgStr.length - 2 )); // crlf is added by log
			
			me._doOnMessage(msgStr, rinfo);
	});
	
	this._server.on("listening", function () {
			me.log('Start listening %s:%s',  me.srcAddress ? me.srcAddress: "*", me.port);
			if (me._onListening) {// Inherits
				me._onListening.call(me, msg, rinfo);
			}
	});
	
	this._server.on("close", function () {
			if (me._onClose) {// Inherits
				me._onClose.call(me, msg, rinfo);
			}
			me.log('Stop listening %s.',  me.srcAddress ? me.srcAddress: "*", me.port);
	});
	
	this._server.on("error", function (exception) {
			if (exception.code === "EACCES") {
				me.log("Not enought privilege to listen on port %d (try to run as root)", me.port);
			}
			me.emit('error', exception);
	});
	
	this._server.bind(this.port);
};


/**
* @private 
* @method
*/
Syslog.prototype._doOnMessage = function(/* String */ msg, rinfo) {
	process.stdout.write(msg);
};


/** 
* Log only if verbose is positive
* @public
* @method
*/
Syslog.prototype.log = function() {
	if (!this.verbose) {
		return;
	}
	var 
	args = arguments,
	v = 'verbose# ';
	args[0] = args[0].replace('\n', '\n' + v);
	args[0] = v.concat(args[0]);
	console.log.apply(console, args);
};

/**
* @private
*/
Syslog.prototype._eexception = function(exception) {
	var error;
	if (exception instanceof Error) {
		error = exception;
	} else {
		error = new Error(exception.message);
		Error.captureStackTrace(error, Syslog.prototype._eexception); // we do not trace this function
		error.code = exception.code;
	}
	
	this.emit('error', error);
	if (this.verbose) {
		console.log(error.stack);
	}
};


/**
* Read NETASQ syslog and put them in files
* @public
* @class
* @param config.directory: {directory} 
* @param config.output: {Writable Stream} // default to process.stdout
* @param config.filesMaxSize: {number} as Bytes // default 4GB
* @param Syslog.config {object}
* @inherits Syslog
*/
var SyslogTo = function (config) { // ctor
	var 
	me = this;
	config =  config || {};
	
	this.directory = config.directory;
	this.output = config.output || process.stdout;
	this.filesMaxSize = config.filesMaxSize ||  1024 * 1024 * 1024 * 4 // 4 Go
	
	this.writer = syslogwriter.create({
			directory: this.directory,
			filesMaxSize: this.filesMaxSize
	});
	this.writer.on('error', function(exception) {
			me.emit('error', exception);
	});
	
	
	Syslog.call(this, config);
};
util.inherits(SyslogTo, Syslog);


/**
* @private
*/
SyslogTo.prototype._doOnMessage = function(/* String */ msg, rinfo) {
	this.output.write(msg);
	this.writer.write(msg);
};


/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) {
	if (config && config.directory){
		return new SyslogTo(config);
	}
	return new Syslog(config); 
};