var http = require('http');
var models  = require('./models');
var io = require('socket.io').listen(http.createServer().listen(8080));
//var raspi = require('raspi-io');
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

        var motor1 = new five.Motor({
            pins: {
                pwm: 1
            }
        });

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

    io.on('connection', function (socket) {
        port.on('data',
            function (data) {
                charString = bufferToCharString(data);
                if (charString.length == 16) {
                    pumpTable.findAll({where: {driver_code: "" + charString[14] + charString[15]}})
                        .then(function (pump) {
                            socket.emit("accVolReading", {
                                accVol: charString.slice(2, 7).reduce( (prev, curr) => prev + curr, ""),
                                pumpName: pump[0].pump_name,
                                units: charString.slice(10, 2).reduce( (prev, curr) => prev + curr, "")
                        });

                            socket.emit("pumpStatus",{
                                pump:pump[0].pump_name,
                                status:statusTranslation(charString.slice(16,1))
                            });
                        });
                }
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

//setup timer for calls to pumps that are currently active, so we can update acc vols
    setInterval(function () {
        pumpTable.findAll({where: {current_rate: {$gt: 0}}})
            .then(function (pumps) {
                pump.forEach(
                    (pump) => {
                    var output = pump.dataValues.driver_code + "VOL\r";
                    port.write(output);
                    }
                )
                ;
            });
    }, 10, 000);
}

var bufferToCharString = function(data){
    var myCharString = new Array();
    for (var i=0;i<data.length; i++){
        myCharString[i] = String.fromCharCode(data[i]);
    }
    return myCharString;
}

serialBus.write = function (data){
    console.log(data);
    //port.write(data);
}
module.exports = serialBus;


