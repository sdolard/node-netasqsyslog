var
assert = require('assert'),
util = require('util'),
fs = require('fs'),
syslogwriter = require('../lib/syslogwriter'),
dataTestA = [
	'<134>id=firewall time="2011-10-13 13:11:39" fw="fw_ihm" tz=+0200 ',
	'startime="2011-10-13 13:09:38" pri=5 confid=01 slotlevel=2 ruleid=3 ',
	'srcif="Ethernet1" srcifname="in" ipproto=udp dstif="Ethernet0" dstifname="out" ',
	'proto=dns src=10.2.52.1 srcport=55765 srcportname=ephemeral_fw_udp dst=10.0.0.124 ',
	'dstport=53 dstportname=domain_udp dstname=jupiter.netasq.com modsrc=10.2.52.1 ',
	'modsrcport=55765 origdst=10.0.0.124 origdstport=53 sent=50 rcvd=89 duration=0.00 ',
	'logtype="tmp"\r\n'
].join(''),
dataResultA = [
	'id=firewall time="2011-10-13 13:11:39" fw="fw_ihm" tz=+0200 ',
	'startime="2011-10-13 13:09:38" pri=5 confid=01 slotlevel=2 ruleid=3 ',
	'srcif="Ethernet1" srcifname="in" ipproto=udp dstif="Ethernet0" dstifname="out" ',
	'proto=dns src=10.2.52.1 srcport=55765 srcportname=ephemeral_fw_udp dst=10.0.0.124 ',
	'dstport=53 dstportname=domain_udp dstname=jupiter.netasq.com modsrc=10.2.52.1 ',
	'modsrcport=55765 origdst=10.0.0.124 origdstport=53 sent=50 rcvd=89 duration=0.00\r\n'
].join(''),
dataTestB = [
	'<134>id=firewall time="2011-10-13 13:11:38" fw="fw_ihm" tz=+0200 ',
	'startime="2011-10-13 13:09:38" pri=5 confid=01 slotlevel=2 ruleid=3 ',
	'srcif="Ethernet1" srcifname="in" ipproto=udp dstif="Ethernet0" dstifname="out" ',
	'proto=dns src=10.2.52.1 srcport=55765 srcportname=ephemeral_fw_udp dst=10.0.0.124 ',
	'dstport=53 dstportname=domain_udp dstname=jupiter.netasq.com modsrc=10.2.52.1 ',
	'modsrcport=55765 origdst=10.0.0.124 origdstport=53 sent=50 rcvd=89 duration=0.00 ',
	'logtype="alarm"\r\n'
].join(''),
dataResultB = [
	'id=firewall time="2011-10-13 13:11:38" fw="fw_ihm" tz=+0200 ',
	'startime="2011-10-13 13:09:38" pri=5 confid=01 slotlevel=2 ruleid=3 ',
	'srcif="Ethernet1" srcifname="in" ipproto=udp dstif="Ethernet0" dstifname="out" ',
	'proto=dns src=10.2.52.1 srcport=55765 srcportname=ephemeral_fw_udp dst=10.0.0.124 ',
	'dstport=53 dstportname=domain_udp dstname=jupiter.netasq.com modsrc=10.2.52.1 ',
	'modsrcport=55765 origdst=10.0.0.124 origdstport=53 sent=50 rcvd=89 duration=0.00\r\n'
].join(''),
writer = syslogwriter.create({
		directory: __dirname,
		verbose: false
}),
writtingEvent = false,
writtenTmp = false,
writtenAlarm = false;


writer.on('writting', function() {
		writtingEvent = true;
});

writer.on('written', function() {
		fs.unlink(__dirname + '/l_tmp' , function (err) {
				if (err) {
					throw err;
				}
				writtenTmp = true;
				fs.unlink(__dirname + '/l_alarm', function (err) {
						if (err) {
							throw err;
						}
						writtenAlarm = true;
				});
		});
});

writer.write(dataTestA);
writer.write(dataTestB);

process.on('exit', function () {
		assert.strictEqual(writtingEvent, true, 'writtingEvent done');
		assert.strictEqual(writtenTmp, true, 'writtingEvent done');
		assert.strictEqual(writtenAlarm, true, 'writtingEvent done');
});
