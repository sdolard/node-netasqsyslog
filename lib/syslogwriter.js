/*
firewall log format
"l_" + "log name" + '8 chars log number' + 'start date' + 'end date' + 'line number'
Ex: l_connection_00000000_20100831170814_20100915012956_12545
2010 08 31 17 08 14 
2010 09 15 01 29 56
5Mo max
*/
var path = require('path'),

/**
* @public
*/
SyslogWriter = function (config) {   
	config = config || {};
	this.directory = config.directory;
	
	// Directory test
	if (!path.existsSync(this.directory)) {
		throw {
			code: 'EDIRNOTFOUND',
			message: 'Directory do not exists: "' + this.directory + '"'
		};
	}
};


SyslogWriter.prototype.write = function() {
	
};


/*******************************************************************************
* Exports
*******************************************************************************/
exports.createSyslogWriter = function(config) { return new SyslogWriter(config); };
