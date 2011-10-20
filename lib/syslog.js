/*
firewall log format
"l_" + "log name" + '8 chars log number' + 'start date' + 'end date' + 'line number'
Ex: l_connection_00000000_20100831170814_20100915012956_12545
2010 08 31 17 08 14 
2010 09 15 01 29 56
5Mo max
*/


var dgram = require("dgram"),

/**
* Read NETASQ syslog
* @public
* @param config.srcAddress: {string} // default to any
* @param config.outputDirectory: {Writable Stream} // default to stdout
* @param config.port: {number} // default 514
* @param config.ipv6: {boolean} // default false,
* @param config.verbose: {boolean} // default false
*/
Syslog = function(config) {
	// config
	config =  config || {};
	this.srcAddress = config.srcAddress; // or undefined
	this.outputDirectory = config.outputDirectory || process.stdout;
	this.port = config.port || 514;
	this.ipv6 = config.ipv6 || false;  
	this.verbose = config.verbose || false;
	
	var me = this;	
	
	/**
	* @private
	*/
	this.server = undefined;
	
	
	/**
	* @public
	* @return bool
	*/
	this.start = function() {
		if (me.server) {
			return;
		}
		me.log('Trying to listening %s:%s...',  me.srcAddress ? me.srcAddress: "*", me.port);
		
		me.server = dgram.createSocket(me.ipv6 ? "udp6" : "udp4");
		
		me.server.on("message", function (msg, rinfo) {
				if (this.srcAddress && rinfo.address !== this.srcAddress) {
					return;
				}
				me.log('From %s: %s', rinfo.address, msg);
		});
		
		me.server.on("listening", function () {
				me.log('Start listening %s:%s',  me.srcAddress ? me.srcAddress: "*", me.port);
		});
		
		me.server.on("close", function () {
				me.log('Stop listening %s.',  me.srcAddress ? me.srcAddress: "*", me.port);
		});
		
		try {
			me.server.bind(me.port);
		} catch(err) {
			if (err.code === "EACCES") {
				console.log("Not enought privilege to listen on port %d (run as root?)", me.port);
				throw err;
			}
		}
	};
	
	this.stop = function() {
		if (!me.server) {
			return;
		}
		
		me.server.close();
		me.server = undefined;
	};
	
	/** 
	* Log only if verbose is positive
	* @public
	* @method
	*/
	this.log = function() {
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
};



/*******************************************************************************
* Exports
*******************************************************************************/
exports.createSyslog = function(config) { return new Syslog(config); };