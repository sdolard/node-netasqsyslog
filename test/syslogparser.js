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
].join('');

function onDone(data) {
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
}

syslogParser.on('done', onDone);
syslogParser.parse(dataTest);
/*
console.time('1000000-elements');
for (var i = 1; i < 1000000; i++) { 
	syslogParser.parse(dataTest);
}
process.on('exit', function () {
		console.log('size: %d', size);
		console.timeEnd('1000000-elements');
});
*/
// size: 447000000  > 43,88 MB/s
// 1000000-elements: 9948ms 

