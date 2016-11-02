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
var activePumps;

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
            port.on('data',
                function (data) {
                    charString = bufferToCharString(data);
                    if(charString.length>1) {
                        responseString = charString.join("").split("\r");
                        if (charString.length == 17) {
                            driverCode = "" + charString[14] + charString[15];
                            pump = activePumps.filter(function (element) {
                                if (element.driver_code == driverCode)return true
                            })[0];
                            accVol = charString.slice(1, 9).reduce((prev, curr) => prev + curr, "").trim();
                            pumpName = pump.pump_name;
                            units = charString.slice(10, 12).reduce((prev, curr) => prev + curr, "");

                            socket.emit("accVolReading", {
                                accVol: accVol,
                                pumpName: pumpName,
                                units: units
                            });

                            socket.emit("pumpStatus", {
                                pump: pump.pump_name,
                                status: statusTranslation(charString.slice(16, 1))
                            });
                        }
                    }
                }
            );

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
        });
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

//setup timer for calls to pumps that are currently active, so we can update acc vols
    setInterval(function () {
        pumpTable.findAll({where: {isRunning: {$eq: true}}})
            .then(function (pumps) {
                activePumps = pumps;
                pumps.forEach(
                    (pump) => {
                    var output = pump.driver_code + "VOL\r";
                    port.write(output);
                    }
                );
            });
    },20000);
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
        runningString+=String.fromCharCode(data[i]);
    }
    return myCharString;
}

serialBus.write = function (data){
    port.write(data);
}
module.exports = serialBus;


