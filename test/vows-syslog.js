var 
vows = require('vows'),
assert = require('assert'),
util = require('util'),
events = require("events"),
path = require("path"),
fs = require("fs"),
syslog = require('../lib/syslog');

exports.suite1 = vows.describe('syslog test').addBatch({
		'When listenning on loopback without root level': {
			topic: function() {
				var
				promise = new events.EventEmitter();
				sl = syslog.create(); 
				sl.on('error', function(err) {
						promise.emit('success', err);
				});				
				return promise;
			},
			"it throws an EACCES Error": function (err) {
				assert.strictEqual(err.code, 'EACCES');
			}
		}
});
