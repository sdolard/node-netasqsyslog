var 
vows = require('vows'),
assert = require('assert'),
util = require('util'),
events = require("events"),
path = require("path"),
fs = require("fs"),
syslogwriter = require('../lib/syslogwriter'),
test1Filename = 'tmp',
test1FilePath = path.normalize(__dirname + '/' + test1Filename + '_2011_286.log'),
test1LogData = [
	'id=firewall time="2011-10-13 13:11:39" fw="fw_ihm" tz=+0200 ',
	'startime="2011-10-13 13:09:38" pri=5 confid=01 slotlevel=2 ruleid=3 ',
	'srcif="Ethernet1" srcifname="in" ipproto=udp dstif="Ethernet0" dstifname="out" ',
	'proto=dns src=10.2.52.1 srcport=55765 srcportname=ephemeral_fw_udp dst=10.0.0.124 ',
	'dstport=53 dstportname=domain_udp dstname=jupiter.netasq.com modsrc=10.2.52.1 ',
	'modsrcport=55765 origdst=10.0.0.124 origdstport=53 sent=50 rcvd=89 duration=0.00'
].join(''),
test1Data = [
	'<134>',
	test1LogData,
	' logtype="', test1Filename,'"',
	'\r\n'
].join(''),

test1Filename2 = 'connection',
test1FilePath2 = path.normalize(__dirname + '/' + test1Filename2 + '_2012_86.log'),
test1LogData2 = [
'id=firewall time="2012-03-26 10:53:21" fw="fwgui" tz=+0200 startime="2012-03-26 10:51:20"',
' pri=5 confid=01 slotlevel=0 ruleid=0 srcif="Ethernet1" srcifname="in" ipproto=udp',
' dstif="Ethernet0" dstifname="out" proto=dns src=10.2.8.1 srcport=60192 ',
'srcname=daniel_range dst=127.0.0.2 dstport=53 dstportname=domain_udp ',
'dstname=Firewall_loopback_1 modsrc=10.2.8.1 modsrcport=60192 ',
'origdst=10.2.0.1 origdstport=53 ipv=4 sent=33 rcvd=209 duration=0.00"'
].join(''),
test1Data2 = [
	'<14>',
	test1LogData2,
	' logtype="', test1Filename2,'"',
	'\r\n'
].join('');

exports.suite1 = vows.describe('syslog writer test').addBatch({
		'When giving valid data': {
			topic: function() {
				var
				promise = new events.EventEmitter();
				syslogWriter = syslogwriter.create({
						directory: __dirname
				}); 
				syslogWriter.on('written', function(filename) {
						promise.emit('success', filename);
				});
				syslogWriter.write(test1Data);
				
				return promise;
			},
			"file is created": function (filename) {
				assert.isTrue(path.existsSync(test1FilePath));
			},
			"it's write in the correct filename": function (filename) {
				assert.strictEqual(filename, test1FilePath);
			},
			"written data are correcte": function (filename) {
				assert.strictEqual(fs.readFileSync(test1FilePath, 'utf8'), test1LogData + '\r\n');
			}
		},		
		'When giving another valid data set': {
			topic: function() {
				var
				promise = new events.EventEmitter();
				syslogWriter = syslogwriter.create({
						directory: __dirname
				}); 
				syslogWriter.on('written', function(filename) {
						promise.emit('success', filename);
				});
				syslogWriter.write(test1Data2);
				
				return promise;
			},
			"file is created": function (filename) {
				assert.isTrue(path.existsSync(test1FilePath2));
			},
			"it's write in the correct filename": function (filename) {
				assert.strictEqual(filename, test1FilePath2);
			},
			"written data are correcte": function (filename) {
				assert.strictEqual(fs.readFileSync(test1FilePath2, 'utf8'), test1LogData2 + '\r\n');
			}
		},
		"day number of 2012-03-23": {
			topic: function() {
				var d = new Date(2012, 2, 23);
				return syslogwriter.dayNumber(new Date(2012, 2, 23));
			},
			"is equal to 83": function(dayNumber) {
				assert.strictEqual(dayNumber, 83);
			}
		},
		"day number of 2012-03-23 23:59:59,999": {
			topic: function() {
				return syslogwriter.dayNumber(new Date(2012, 2, 23, 23, 59, 59, 999));
			},
			"is equal to 83": function(dayNumber) {
				assert.strictEqual(dayNumber, 83);
			}
		}    
}).
addBatch({
		'Finnaly, we remove tmp_2011_287 file': {
			topic: function() {
				fs.unlink(test1FilePath, this.callback);
			},
			"Ok": function (err) {
				assert.isUndefined(err);
			}
		}
}).
addBatch({
		' and connection_2012_86 file': {
			topic: function() {
				fs.unlink(test1FilePath2, this.callback);
			},
			"Ok": function (err) {
				assert.isUndefined(err);
			}
		}
}).
addBatch({
		'When giving invalid data': {
			topic: function() {
				var
				promise = new events.EventEmitter();
				syslogWriter = syslogwriter.create({
						directory: __dirname
				}); 
				syslogWriter.on('error', function(err) {
						promise.emit('success', err);
				});
				syslogWriter.write(' ');
				
				return promise;
			},
			"it throws an EINVALIDDATA Error": function (err) {
				assert.strictEqual(err.code, 'EINVALIDDATA');
			}
		},
		'When giving empty data': {
			topic: function() {
				var
				promise = new events.EventEmitter();
				syslogWriter = syslogwriter.create({
						directory: __dirname
				}); 
				syslogWriter.on('error', function(err) {
						promise.emit('success', err);
				});
				syslogWriter.write();
				
				return promise;
			},
			"it throws an EEMPTYDATA Error": function (err) {
				assert.strictEqual(err.code, 'EEMPTYDATA');
			}
		},
		'When giving no output directory': {
			topic: function() {
				var
				promise = new events.EventEmitter();
				syslogWriter = syslogwriter.create(); 
				syslogWriter.on('error', function(err) {
						promise.emit('success', err);
				});
				syslogWriter.write(test1Data);
				
				return promise;
			},
			"it throws an EEMPTYDIRECTORY Error": function (err) {
				assert.strictEqual(err.code, 'EEMPTYDIRECTORY');
			}
		},
		'When giving an invalid output directory': {
			topic: function() {
				var
				promise = new events.EventEmitter();
				syslogWriter = syslogwriter.create({
						directory: 'fakedir'
				}); 
				syslogWriter.on('error', function(err) {
						promise.emit('success', err);
				});
				syslogWriter.write(test1Data);
				
				return promise;
			},
			"it throws an EDIRNOTFOUND Error": function (err) {
				assert.strictEqual(err.code, 'EDIRNOTFOUND');
			}
		}
});