var http = require('http');
var models  = require('./models');
var socket = require('socket.io').listen(http.createServer().listen(8090));
var raspi = require('raspi-io');
var five = require('johnny-five');
var serialPort = require('serialport');


/*
Not utilized, but kept around for future, in case there is a reason to query db tables with added functionality.
 */
var pumpTable = models.pump;
var modeTable = models.mode;
var pumpModeRateTable = models.pump_mode_rate;

var serialBus = {};

serialBus.initialize = function() {

    //init serialPort
    var port = new serialPort('/dev/ttyUSB0');

    //initializes library for delegation to low-level rasberry pi io operations
    var board = new five.Board({
        io: new raspi()
    });

    //event handler for code that we want to run when library is initialized against rasberry pi
    board.on('ready', function () {


        //Setup api to delegate to pin 1 using pwm. This is for stirrer control
        var motor1 = new five.Motor(1);

        socket.on('connection', function (socket) {

                /*when we recieve an event from the ui for changing the rate of the stirrer motor via tcp socket, we delegate that to our
                 motor object that then handles setting the pwm output on pin 1 of the rasberry pi
                 */
                socket.on('motorChange', function (data) {
                    var rate = data.rate;
                    motor1.start(rate);
                })


                /*
                  This code is commented out due to the failure of an initial approach for keeping track of accVol. The pumps did not respond in a timely manner
                  to volume queries, so the logic was implemented within the application. That being said, this code was kept around in case any there was a use case for
                  writing a query against the pump drivers in the future; this code would handle receiving input from queries to the drivers and would have to distinguish based on the content of the response.
                 */
                /*
                port.on('data',
                    function (data) {
                        charString = bufferToCharString(data);
                    });
                */

                //expose the socket on serialBus object so that it can be utilized in other files via serialbus object export
                serialBus.socket=socket;
            }
        );
    });

    /*
        Supplementary functions for parsing pump driver query response. The status translation represents a function for simply mapping the response codes to their
        context in terms of pump status. The bufferToCharString function is responsible for parsing the pump driver response that comes in the form of a buffer filled with ascii codes, to
        a group of strings.
     */
    var statusTranslation = function(input){
        switch(input){
            case ":":
                return "Stopped"
            case ">":
                return "Running"
            case "*T":
                return "Target Volume Reached"
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
        myCharString.push(runningString.trim());
        return myCharString;
    }


}

/*
    Function for writing to serialport. This is around in case we wanted to add some standard procedures on writing to the serialport and did not want to have to implement that in each area where we wrote to it.
 */
serialBus.write = function (data){
    port.write(data);
}

module.exports = serialBus;


