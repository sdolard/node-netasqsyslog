
/**
* @private class
*/
var LogFile = function (logType){
	var me = this;
	
	this.logType = logType;
	if (!logType || logType === '') {
		throw {
			code: 'EINVALIDLOGTYPE',
			message: 'Invalide log type'
		};
	}
		
	this.writableStream = {};
	this.writtenSize = 0; //for rotation
	this.writtenLine = 0; //for rotation
	this.youngerLine = 0; //for rotation
	this.olderLine = 0; //for rotation
		
	if(this._logsWritableStream[logType]) {
		this._closeWritableStream(logType);
		return;
	}
	this._writableStreams = fs.createWriteStream(this.directory);

    // Emitted on error with the exception exception.	
	this._logsWritableStream.on('error', function(exception) {
			me.log('SyslogWriter writableStream error: %s (%s)', exception.message, exception.code);
			throw exception;
	});
	
	// Emitted when the underlying file descriptor has been closed.	
	this._logsWritableStream.on('close', function(exception) {
		me.log('SyslogWriter writableStream close');
	});
	

	// Emitted after a write() method was called that returned false to indicate that it is safe to write again.
	this._logsWritableStream.on('drain', function() {
		me.log('SyslogWriter writableStream drain');
	});
};

/**
*/
LogFile.prototype.write = function(string) {
}

