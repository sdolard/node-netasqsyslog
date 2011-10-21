var
assert = require('assert'),
util = require('util'),
fs = require('fs'),
logfile = require('../lib/logFile'),
dataTest = [
	'id=firewall time="2011-10-13 13:11:39" fw="fw_ihm" tz=+0200 ',
	'startime="2011-10-13 13:09:38" pri=5 confid=01 slotlevel=2 ruleid=3 ',
	'srcif="Ethernet1" srcifname="in" ipproto=udp dstif="Ethernet0" dstifname="out" ',
	'proto=dns src=10.2.52.1 srcport=55765 srcportname=ephemeral_fw_udp dst=10.0.0.124 ',
	'dstport=53 dstportname=domain_udp dstname=jupiter.netasq.com modsrc=10.2.52.1 ',
	'modsrcport=55765 origdst=10.0.0.124 origdstport=53 sent=50 rcvd=89 duration=0.00\r\n'
].join(''),
endData = '',
size = 0,
rs, 
logFile,
EEMPTYFILENAME = false,
EEMPTYDIRECTORY = false,
EDIRNOTFOUND = false,
endEvent = false,
closeEventUnlink = false,
elements = 1, // 1,//1000000,
elementsIO = parseInt(elements, 10) + '-elements-io',
elementsLoop = parseInt(elements, 10) + '-elements-Loop',
start, end, mem;


try {
	logFile = logfile.create();
}
catch(exceptionFoo) {
	if (exceptionFoo.code === 'EEMPTYFILENAME') {
		EEMPTYFILENAME = true;
	}
}

try {
	logFile = logfile.create({
			fileName: 'l_connection'
	});
}
catch(exceptionBar) {
	if (exceptionBar.code === 'EEMPTYDIRECTORY') {
		EEMPTYDIRECTORY = true;
	}
}

try {
	logFile = logfile.create({
			directory: '•ë“‘',
			fileName: 'l_connection'
	});
}
catch(exceptionBaz) {
	if (exceptionBaz.code === 'EDIRNOTFOUND') {
		EDIRNOTFOUND = true;
	}
}


logFile = logfile.create({
		directory: __dirname,
		fileName: 'l_connection',
		writeDelay: 1
		
});
logFile.on('writting', function(fileName){
		if (elements > 1 ) {
			console.time(elementsIO);
			start = Date.now();
		}
});

logFile.on('written', function(fileName){
		if (size > 1024 * 1024) {
			console.timeEnd(elementsIO);
			end = Date.now();
			console.log('%dMB/s', size / 1024 / 1024 * 1000 / (end - start));
		}
		
		rs = fs.createReadStream(fileName, { 
				encoding: 'utf8'
		});
		
		rs.on('data', function (data) { 
				if (elements === 1) {
					endData += data; 
				}
		});
		rs.on('end', function () { 
				endEvent = true;
		});
		rs.on('error', function (exception) { 
				console.log('exception: %s(%s)', exception.message, exception.code);
		});
		rs.on('close', function () { 
				// Clean up
				fs.unlink(fileName, function (err) {
						if (err) {
							throw err;
						}
						closeEventUnlink = true;
				});
				if (elements === 1) {
					assert.equal(endData, dataTest);
				}
		});
});

if (elements > 1 ) {
	console.time(elementsLoop);
}
for (var i = 0; i < elements; i++) {
	logFile.write(dataTest); 
	size += dataTest.length;
}
if (elements > 1 ) {
	console.timeEnd(elementsLoop);
}
if (size > 1024 * 1024) {
	mem = process.memoryUsage();
	console.log('rss: %dMB',  mem.rss / 1024 / 1024);
	console.log('vsize: %dMB',  mem.vsize / 1024 / 1024);
	console.log('heapTotal: %dMB',  mem.heapTotal / 1024 / 1024);
	console.log('heapUsed: %dMB',  mem.heapUsed / 1024 / 1024);
}

process.on('exit', function () {
		assert.strictEqual(EEMPTYFILENAME, true, 'EEMPTYFILENAME done');
		assert.strictEqual(EEMPTYDIRECTORY, true, 'EEMPTYDIRECTORY done');
		assert.strictEqual(EDIRNOTFOUND, true, 'EDIRNOTFOUND done');
		assert.strictEqual(endEvent, true, 'endEvent done');
		assert.strictEqual(closeEventUnlink, true, 'closeEventUnlink done');		
});

/*
logFile.write
-------------
1000000-elements-Loop: 986ms
rss: 191.20703125MB
vsize: 3129.06640625MB
heapTotal: 182.4703369140625MB
heapUsed: 156.18316650390625MB
1000000-elements-io: 8497ms
50.39422950057741MB/s


logFile.writeSync
-------------
1000000-elements-Loop: 8220ms
rss: 456.97265625MB
vsize: 3406.1640625MB
heapTotal: 23.1846923828125MB
heapUsed: 6.935150146484375MB
1000000-elements-io: 8508ms
50.329074760978635MB/s
*/

/**
logFile.write, buffer size 4096
-------------
1000000-elements-Loop: 1098ms
rss: 191.20703125MB
vsize: 3129.06640625MB
heapTotal: 182.4703369140625MB
heapUsed: 156.18377685546875MB
1000000-elements-io: 33809ms
12.665259784862204MB/s


logFile.write, buffer size 16384
-------------
rss: 191.22265625MB
vsize: 3121.09765625MB
heapTotal: 182.5015869140625MB
heapUsed: 156.18750762939453MB
1000000-elements-io: 9676ms
44.25379992418419MB/s


logFile.write, buffer size 32768
-------------
1000000-elements-Loop: 948ms
rss: 191.2109375MB
vsize: 3121.08203125MB
heapTotal: 182.4859619140625MB
heapUsed: 156.1850128173828MB
1000000-elements-io: 8217ms
52.111447981794605MB/s


logFile.write, buffer size 65536
-------------
1000000-elements-Loop: 974ms
rss: 191.22265625MB
vsize: 3121.09765625MB
heapTotal: 182.5015869140625MB
heapUsed: 156.18667602539062MB
1000000-elements-io: 7909ms
54.14082286842916MB/s


logFile.write, buffer size 132072
-------------
1000000-elements-Loop: 986ms
rss: 191.22265625MB
vsize: 3121.09765625MB
heapTotal: 182.5015869140625MB
heapUsed: 156.1884536743164MB
1000000-elements-io: 8048ms
53.205736588768175MB/s

*/





