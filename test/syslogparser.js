var
assert = require('assert'),
util = require('util'),
syslogParser = require('../lib/syslogparser').create({
		//verbose: true
}),
size = 0,
dataTest = [
	'<134>id=firewall time="2011-10-13 13:11:39" fw="fw_ihm" tz=+0200 ',
	'startime="2011-10-13 13:09:38" pri=5 confid=01 slotlevel=2 ruleid=3 ',
	'srcif="Ethernet1" srcifname="in" ipproto=udp dstif="Ethernet0" dstifname="out" ',
	'proto=dns src=10.2.52.1 srcport=55765 srcportname=ephemeral_fw_udp dst=10.0.0.124 ',
	'dstport=53 dstportname=domain_udp dstname=jupiter.netasq.com modsrc=10.2.52.1 ',
	'modsrcport=55765 origdst=10.0.0.124 origdstport=53 sent=50 rcvd=89 duration=0.00 ',
	'logtype="connection"\r\n'
].join(''),
elements = 1, // 1,//1000000,
elementsParse = parseInt(elements, 10) + '-elements-parse',
start, end,
ONDONE = false,
EEMPTYDATA = false,
EINVALIDDATA = false;

syslogParser.on('done', function (data) {
		ONDONE = true;
		assert.strictEqual(data.facility, 16, 'facility test');
		assert.strictEqual(data.severity, 6, 'severity test');
		assert.strictEqual(data.logType, 'connection', 'logType test');
		assert.equal(data.data, [
				'id=firewall time="2011-10-13 13:11:39" fw="fw_ihm" tz=+0200 ',
				'startime="2011-10-13 13:09:38" pri=5 confid=01 slotlevel=2 ruleid=3 ',
				'srcif="Ethernet1" srcifname="in" ipproto=udp dstif="Ethernet0" dstifname="out" ',
				'proto=dns src=10.2.52.1 srcport=55765 srcportname=ephemeral_fw_udp dst=10.0.0.124 ',
				'dstport=53 dstportname=domain_udp dstname=jupiter.netasq.com modsrc=10.2.52.1 ',
				'modsrcport=55765 origdst=10.0.0.124 origdstport=53 sent=50 rcvd=89 duration=0.00'
		].join(''), 'data test');
		size += data.data.length;
});

syslogParser.on('error', function(exception) {
		if (exception.code ===  'EEMPTYDATA') {
			EEMPTYDATA = true;
			return;
		}
		if (exception.code ===  'EINVALIDDATA') {
			EINVALIDDATA = true;
			return;
		}
});



process.on('exit', function () {
		if (size > 1024 * 1024) {
			console.timeEnd(elementsParse);
			end = Date.now();
			console.log('%dMB/s', size / 1024 / 1024 * 1000 / (end - start));
		}
		if (elements === 1) {
			assert.strictEqual(ONDONE, true, 'ONDONE done');
			assert.strictEqual(EEMPTYDATA, true, 'EEMPTYDATA done');
		}
});

if (elements === 1) {
	syslogParser.parse('');
	syslogParser.parse(dataTest);
} else {
	console.time(elementsParse);
	start = Date.now();
	for (var i = 1; i < elements; i++) { 
		syslogParser.parse(dataTest);
	}
	
}

/*
1000000-elements-parse: 8983ms
47.450132807343536MB/s
*/

