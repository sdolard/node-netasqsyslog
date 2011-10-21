var 
pkginfo = require('pkginfo')(module, 'version', 'author', 'email', 'bugs'), // contrib
dgram = require("dgram"),
util = require('util'),
syslogwriter = require('./syslogwriter'),


/**
* Read NETASQ syslog
* @public
* @class
* @param config.srcAddress: {string} // default to any
* @param config.port: {number} // default 514
* @param config.ipv6: {boolean} // default false,
* @param config.verbose: {boolean} // default false
*/
Syslog = function(config) { // ctor
	config =  config || {};
	this.srcAddress = config.srcAddress; // or undefined
	this.port = config.port || 514;
	this.ipv6 = config.ipv6 || false;  
	this.verbose = config.verbose || false;
};


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
	this.log('Trying to listening %s:%s...',  this.srcAddress ? this.srcAddress: "*", this.port);
	
	this._server = dgram.createSocket(this.ipv6 ? "udp6" : "udp4");
	
	this._server.on("message", function (msg, rinfo) {
			/*
			rinfo {
			size {number},
			address {string},
			port {number}
			}
			*/
			if (me.srcAddress && rinfo.address !== me.srcAddress) {
				return;
			}
			me.log('From %s: %s', rinfo.address, msg);
			
			if (me._onMessage) {// Inheritage
				me._onMessage.call(me, msg, rinfo);
			}
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
	
	try {
		this._server.bind(this.port);
	} catch(err) {
		if (err.code === "EACCES") {
			console.log("Not enought privilege to listen on port %d (run as root?)", this.port);
			throw err;
		}
	}
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
	console.error.apply(console, args);
};


/**
* Read NETASQ syslog and put them in files
* @public
* @class
* @param config.directory: {directory} 
* @param config.output: {Writable Stream} // default to process.stdout
* @param Syslog.config {object}
* @inherits Syslog
*/
var SyslogTo = function (config) {
	config =  config || {};
	SyslogTo.super_.call(this, config);
	
	this.directory = config.directory;
	this.output = config.output || process.stdout;
	
	this.writer = syslogwriter.create({
			directory: this.directory,
			maxSize: 1024 * 1024 * 5 // 5 Mo
	});
	
	// called by Syslog
	this._onMessage = function(msg, rinfo) {
		this.output.write(msg);
		this.writer.write(msg.toString('utf8'));
	};
};
util.inherits(SyslogTo, Syslog);



/*******************************************************************************
* Exports
*******************************************************************************/
exports.create = function(config) { 
	if (config && config.directory){
		return new SyslogTo(config);
	}
	return new Syslog(config); 
};