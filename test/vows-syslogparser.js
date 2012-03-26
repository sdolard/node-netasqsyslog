var 
vows = require('vows'),
assert = require('assert'),
util = require('util'),
events = require("events"),
syslogparser = require('../lib/syslogparser'),
logData = ['id=firewall time="2011-10-13 13:11:39" fw="fw_ihm" tz=+0200 ',
	'startime="2011-10-13 13:09:38" pri=5 confid=01 slotlevel=2 ruleid=3 ',
	'srcif="Ethernet1" srcifname="in" ipproto=udp dstif="Ethernet0" dstifname="out" ',
	'proto=dns src=10.2.52.1 srcport=55765 srcportname=ephemeral_fw_udp dst=10.0.0.124 ',
	'dstport=53 dstportname=domain_udp dstname=jupiter.netasq.com modsrc=10.2.52.1 ',
	'modsrcport=55765 origdst=10.0.0.124 origdstport=53 sent=50 rcvd=89 duration=0.00'
].join(''),
dataTest = '<134>' + logData + ' logtype="connection"\r\n',

logData2 = [
	'id=firewall time="2012-03-23 18:06:28" fw="fwgui" ',
	'tz=+0100 startime="2012-03-23 18:06:27" pri=5 confid=01 slotlevel=2 ruleid=6',
	' srcif="Ethernet1" srcifname="in" ipproto=tcp dstif="Ethernet0" dstifname="out"',
	' proto=ssl src=10.2.14.33 srcport=49214 srcportname=ephemeral_fw_tcp srcname=seb_vm_windows64Bits',
	' dst=10.2.0.1 dstport=443 dstportname=https dstname=fwlabo modsrc=10.2.14.33 ',
	'modsrcport=49214 origdst=10.2.0.1 origdstport=443 ipv=4 sent=319 rcvd=2665 ',
	'duration=0.02"'
].join(''),
dataTest2 = '<14>' + logData2 + ' logtype="alarm"\r\n';




exports.suite1 = vows.describe('syslog parser test').addBatch({
		'When parsing valid data': {
			topic: function() {
				var 
				promise = new events.EventEmitter(),
				parser = syslogparser.create();
				
				parser.on('data', function(data) {
						promise.emit('success', data);
				});
				parser.parse(dataTest);
				return promise;
			},
			'facility is correct': function (parser, data) {
				assert.strictEqual(data.facility, 16);
			},
			'severity is correct': function (parser, data) {
				assert.strictEqual(data.severity, 6);
			},
			'logtype is correct': function (parser, data) {
				assert.strictEqual(data.logType, 'connection');
			},
			'data are correct': function (parser, data) {
				assert.strictEqual(data.log, logData);
			},
			'date is correct': function (parser, data) {
				assert.strictEqual(data.date.toUTCString(), new Date(2011, 9, 13, 13, 11, 39).toUTCString());
			}
		},'When parsing another valid set of data': {
			topic: function() {
				var 
				promise = new events.EventEmitter(),
				parser = syslogparser.create();
				
				parser.on('data', function(data) {
						promise.emit('success', data);
				});
				parser.parse(dataTest2);
				return promise;
			},
			'facility is correct': function (parser, data) {
				assert.strictEqual(data.facility, 1);
			},
			'severity is correct': function (parser, data) {
				assert.strictEqual(data.severity, 6);
			},
			'logtype is correct': function (parser, data) {
				assert.strictEqual(data.logType, 'alarm');
			},
			'data are correct': function (parser, data) {
				assert.strictEqual(data.log, logData2);
			},
			'date is correct': function (parser, data) {
				assert.strictEqual(data.date.toUTCString(), new Date(2012, 2, 23, 18, 6, 28).toUTCString());
			}
		},
		'When parsing empty data': {
			topic: function() {
				var 
				promise = new events.EventEmitter(),
				parser = syslogparser.create();
				parser.on('error', function(err) {
						promise.emit('success', err);
				});
				parser.parse();
				return promise;
			},
			'it throws a exception': function (err) {
				assert.instanceOf(err, Error);
			},
			'exception code is "EEMPTYDATA" ': function (err) {
			}
		},
		'When parsing invalid data': {
			topic: function() {
				var 
				promise = new events.EventEmitter(),
				parser = syslogparser.create();
				parser.on('error', function(err) {
						promise.emit('success', err);
				});
				parser.parse(' ');
				return promise;
			},
			'it throws a exception': function (err) {
				assert.instanceOf(err, Error);
			},
			'exception code is "EINVALIDDATA" ': function (err) {
				assert.strictEqual(err.code, 'EINVALIDDATA'); 
			}
		}
});