var http = require('http');
var models  = require('./models');
var socket = require('socket.io').listen(http.createServer().listen(8090));
var raspi = require('raspi-io');
var five = require('johnny-five');
var serialPort = require('serialport');


var pumpTable = models.pump;
var modeTable = models.mode;
var pumpModeRateTable = models.pump_mode_rate;

var serialBus = {};

//init port
var port = new serialPort('/dev/ttyUSB0');

serialBus.initialize = function() {
//initialize servo motor
    var board = new five.Board({
        io: new raspi()
    });

    board.on('ready', function () {

        var motor1 = new five.Motor(1);

        socket.on('connection', function (socket) {


                socket.on('motorChange', function (data) {
                    var rate = data.rate;
                    var motorFract = data.rate / 100.0;
                    if (motorFract == 0.0) {
                        rate = 0;
                    } else {
                        rate = motorFract * (1023 - 300) + 300;
                    }
                    motor1.start(rate);
                })
                /*
                 port.on('data',
                 function (data) {
                 charString = bufferToCharString(data);
                 if(charString.length>1) {
                 driverCode = charString[1].replace(/\D/g,'');

                 pump = activePumps.filter(function (element) {
                 if (element.driver_code == driverCode)return true
                 })[0];

                 accVol = charString[0].trim();
                 pumpName = pump.pump_name;

                 socket.emit("accVolReading", {
                 accVol: accVol,
                 pumpName: pumpName,
                 });

                 socket.emit("pumpStatus", {
                 pump: pump.pump_name,
                 status: statusTranslation(charString.slice(16, 1))
                 });
                 }
                 });
                 */
                serialBus.socket=socket;
            }
        );
    });

    function statusTranslation(input){
        switch(input){
            case ":":
                return "Stopped"
            case ">":
                return "Running"
            case "*T":
                return "Target Volume Reached"
        }
    }

}

var bufferToCharString = function(data){
    var myCharString = new Array();
    var counter = 0;
    var runningString = "";
    for (var i=0;i<data.length; i++){
        if(data[i]==13 && i!=0){
            myCharString[counter]=runningString;
            counter++;
            runningString="";
        }
        if(data[i]!=13 && data[i]!=10) {
            runningString += String.fromCharCode(data[i]);
        }
    }
    myCharString.push(runningString);
    return myCharString;
}

serialBus.write = function (data){
    port.write(data);
}
module.exports = serialBus;


