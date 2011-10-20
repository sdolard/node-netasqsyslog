var
assert = require('assert'),
util = require('util'),
fs = require('fs'),
logfile = require('../lib/logfile').create({
		directory: __dirname,
		logType: 'connection',
		writeDelay: 1
		
}),
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
rs;

logfile.on('written', function(fileName){	
		rs = fs.createReadStream(fileName, { 
				encoding: 'utf8'
		});
		
		rs.on('data', function (data) { 
				endData += data; 
				/*var a = data.split('\n');
				assert.equal(a.length, 2);
				endData += a[0];*/
		});
		rs.on('end', function () { 
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
						//console.log('All done!');
				});
				assert.equal(endData, dataTest);
		});
});

logfile.write(dataTest);

/*logfile.on('writting', function(){
console.time('1000000-elements');

});

logfile.on('written', function(){
console.timeEnd('1000000-elements');
console.log('size: %s', size);

// Clean up
fs.unlink(fileName, function (err) {
if (err) {
throw err;
}
console.log('All done!');
});
});


for (var i = 0; i < 1000000; i++) {
logfile.write(dataTest); 
size += dataTest.length;
}
// buffersize 65536
//   426,28 > 10773ms > 39MB/s

*/





