var express = require('express');
var models  = require('../models');
var router = express.Router();
var serialBus = require('../serialBus');

var pumpTable = models.pump;
var modeTable = models.mode;
var pumpModeRateTable = models.pump_mode_rate;


var currVolAccumulation = {};

//Initialize stirrer motor and serialPort
serialBus.initialize();

/*
    On application startup, make sure to set the rate and syringe diameter for each pump, to the defaults that we have stored in db for said pumps. Also, we initialize the currVolume accumulation table.
 */
pumpTable.findAll().then(function (pumps) {
    pumps.forEach(function (pump){
        currVolAccumulation[pump.pump_name] = {};
        currVolAccumulation[pump.pump_name]["curVol"]=0.000;
        var output = pump.driver_code + "ULH " + pump.default_rate + "\r";
        serialBus.write(output);
        setTimeout("",30000);
        var output = pump.driver_code + "MMD " + pump.syringe_diam + "\r";
        serialBus.write(output);
    })
});

/*
    Every second, we want to query the database tables for those pumps that are running, and then emit an event on the open tcp socket, with the running volume for said pumps. The UI on the other
    side of that socket will then update the html with the data accordingly. Note: If this becomes too cumbersome for application, we can utilize volumeAccumulation table to find pumps that are running.
 */
setInterval(function () {
    pumpTable.findAll({where: {isRunning: {$eq: true}}})
        .then(function (pumps) {
            pumps.forEach(
                function(pump) {
                    serialBus.socket.emit('accVolReading',{
                        accVol: currVolAccumulation[pump.pump_name]["curVol"] + currVolAccumulation[pump.pump_name]["curRate"]*((new Date().getTime()-currVolAccumulation[pump.pump_name]["timeStamp"])/3600000),
                        pumpName: pump.pump_name
                    })
                }
            );
        });
},1000);

/* GET home page. This Returns the html page with all the data required for the jade template; that includes the pumps,modes,pumpModeRates (for run modes) and finally the flag for displaying admin functionality or not*/
router.get('/', function(req, res, next) {
    setTimeout(function() {
        pumpTable.findAll().then(function (pumps) {
            modeTable.findAll().then(function (modes) {
                pumpModeRateTable.findAll().then(function (pumpModeRates) {
                    res.render('index', {
                        pumps: pumps,
                        modes: modes,
                        pumpModeRates: pumpModeRates,
                        displayForAdmin: process.argv.length == 3 ? "" : "display:none"
                    });
                });
            })
        });
    },50);
});

/*
    Based on the pumpname sent in the http request, we clear the volume accumulation record corresponding to it in the in-memory volume accumulation table.
 */
router.post('/pumps/volClear',function(req,res,next){
    pumpTable.findAll({where: {pump_name:req.body.pump_name}})
        .then(function(pumps){
            if(pumps) {
                pump = pumps[0];
                currVolAccumulation[pump.pump_name]["curVol"]=0.000;
                currVolAccumulation[pump.pump_name]["timeStamp"] = new Date().getTime();
                res.end();
            }
        });
});

/*
    Find the pumpName whose rate we want to change, then update the volume accumulation table accordingly, while also sending the command to the serialport so that the pump driver can change the rate.
 */
router.post('/pumps/updateRate',function(req,res,next){
    var pumpName = req.body.pumpName;
    var rate = parseFloat(req.body.rate).toFixed(3);
    pumpTable.findAll({where: {pump_name:pumpName}})
        .then(function(pumps){
            if(pumps) {
                var pump = pumps[0];
                var output = pump.driver_code + "ULH " + rate + "\r";
                if(currVolAccumulation[pump.pump_name]["isRunning"]==true) {
                    var curTime = new Date().getTime();
                    currVolAccumulation[pump.pump_name]["curVol"]+=(currVolAccumulation[pumpName]["curRate"]*((curTime-currVolAccumulation[pumpName]["timeStamp"])/3600000))
                    currVolAccumulation[pump.pump_name]["timeStamp"] = curTime;
                    currVolAccumulation[pump.pump_name]["curRate"] = rate;
                }else{
                    currVolAccumulation[pump.pump_name]["curRate"] = rate;
                }
                serialBus.write(output);
                //verify rate update
                /*
                setTimeout(function(){
                    output = pump.driver_code + "RAT" + "\r";
                    serialBus.write(output);
                },500);
                */
                res.end();
            }
        })
});

/*
    Send the run command for the pump specified in the request by pumpname. Also, update the db record to reflect the pumps running status, as well as the curVolume accumulation table.
 */
router.post('/pumps/run/:name',function(req,res,next){
    var pumpName = req.params.name;
    var rate;
    pumpTable.findAll({where: {pump_name: pumpName}})
        .then(function(pump){
            pump = pump[0];
            pump.updateAttributes({isRunning:true});
            var output = pump.driver_code + "RUN\r";
            serialBus.write(output);
            currVolAccumulation[pump.pump_name]["isRunning"] = true;
            currVolAccumulation[pump.pump_name]["timeStamp"] = new Date().getTime();
            if(!currVolAccumulation[pump.pump_name]["curRate"]){
                currVolAccumulation[pump.pump_name]["curRate"]=pump.default_rate;
            }
            res.end();
        })
})

/*
    Send the stop command for the pump specified in the request by pumpName. Also, update the db record to reflect the pumps running status, as well as the curVolume accumulation table
 */
router.post('/pumps/stop/:name',function(req,res,next){
    var pumpName = req.params.name;
    pumpTable.findAll({where: {pump_name: pumpName}})
        .then(function(pump){
            //use pump DriverCode to tell pump to stop
            pump = pump[0];
            pump.updateAttributes({isRunning:false});
            var output = pump.driver_code + "STP\r";
            serialBus.write(output);
            currVolAccumulation[pump.pump_name]["isRunning"]=false;
            currVolAccumulation[pump.pump_name]["curVol"]+=(currVolAccumulation[pump.pump_name]["curRate"]*((new Date().getTime()-currVolAccumulation[pumpName]["timeStamp"])/3600000));
            currVolAccumulation[pump.pump_name]["timeStamp"] = undefined;
            res.end();
        })
})

/*
    Fetch the pumpModeRates that correspond to a given runmode
 */
router.get('/modes/get/:name',function(req,res,next){
    var modeName = req.params.name;
    var response = new Array();

    pumpModeRateTable.findAll({where: {modeModeName: modeName}})
        .then(function(pumpModeRates){
            pumpModeRates.forEach(
                function(element) {
                    response.push({pumpName:element.pumpPumpName,rate:element.rate});
                })
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(response));
        });
})

/*
    Add a new runmode along with the corresponding pumpmoderate
 */
router.post('/modes/add',function(req,res,next){
    var payLoad = req.body;
    var modeName = payLoad["mode_name"];
    delete payLoad['mode_name'];
    modeTable.create({mode_name: modeName})
        .then(function(mode){
            console.log(mode);
            for(var prop in payLoad){
                pumpModeRateTable.create({modeModeName: modeName, pumpPumpName: prop, rate: payLoad[prop]})
                    .then(function(pumpModeRate){
                        console.log(pumpModeRate);
                    });
            }
            res.end();
        })

});

/*
    Delete a run mode (When a runmode record is deleted, so are its corresponding pumpmodeRate records).
 */
router.post('/modes/delete',function(req,res,next){
    var modeName = req.body["mode_name"];
    modeTable.destroy({
        where:{
            mode_name: modeName
        }
    });
    res.end();
});

/*
    Add a pump record
 */
router.post('/pumps/add',function(req,res,next){
    pumpTable.create({pump_name: req.body.pump_name, driver_code: req.body.driver_code, syringe_diam:req.body.syringe_diam,default_rate: req.body.default_rate})
        .then(function(pump) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(pump));
        });
});

/*
    delete a pump record
 */
router.post('/pumps/delete',function(req,res,next){
    pumpTable.destroy({
        where:{
            pump_name: req.body.pump_name
        }
    }).then(function(affectedRows){
        console.log(affectedRows);
        res.end();
    });
})

module.exports = router;
