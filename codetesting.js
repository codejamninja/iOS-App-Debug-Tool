let readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

// let iosDevice = require('node-ios-device');
// iosDevice.devices(function (err, devices) {
//     if (err) {
//         console.error('Error!', err);
//     } else {
//         console.log('Connected devices:');
//         console.log(devices);
//
//     }
// });
// iosDevice.trackDevices()
//     .on('devices', function (devices) {
//         console.log('Connected devices:');
//         console.log(devices);
//     })
//     .on('error', function (err) {
//         console.error('Error!', err);
//     });
function exe() {
    rl.question('line', function(answer){
        console.log("readline "+ answer);
        rl.close();
    })
}
exe();