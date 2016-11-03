var express = require('express');
var models  = require('../models');
var router = express.Router();
var serialBus = require('../serialBus');

var pumpTable = models.pump;
var modeTable = models.mode;
var pumpModeRateTable = models.pump_mode_rate;


var currVolAccumulation = {};

serialBus.initialize();

process.on('uncaughtException', (err) => {
    console.log(err);
});

pumpTable.findAll().then(function (pumps) {
    pumps.forEach(function (pump){
        currVolAccumulation[pump.pump_name]["curVol"]=0.000;
        var output = pump.driver_code + "ULH " + pump.default_rate + "\r";
        serialBus.write(output);
        setTimeout("",10000);
        var output = pump.driver_code + "MMD " + pump.syringe_diam + "\r";
        serialBus.write(output);
        setTimeout("",10000);
    })
});

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

/* GET home page. */
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


router.post('/pumps/volClear',function(req,res,next){
    pumpTable.findAll({where: {pump_name:pumpName}})
        .then(function(pumps){
            if(pumps) {
                pump = pumps[0];
                currVolAccumulation[pump.pump_name]["curVol"]=0.000;
                currVolAccumulation[pump.pump_name]["timeStamp"] = new Date().getTime();
                res.end();
            }
        });
});


router.post('/pumps/updateRate',function(req,res,next){
    var pumpName = req.body.pumpName;
    var rate = parseFloat(req.body.rate).toFixed(3);
    pumpTable.findAll({where: {pump_name:pumpName}})
        .then(function(pumps){
            if(pumps) {
                var pump = pumps[0];
                var output = pump.driver_code + "ULH " + rate + "\r";
                if(currVolAccumulation[pump.pump_name]["isRunning"]==true) {
                    var curTime = new Data().getTime();
                    currVolAccumulation[pump.pump_name]["curVol"]+=(currVolAccumulation[pumpName]["curRate"]*((curTime-currVolAccumulation[pumpName]["timeStamp"])/3600000))
                    currVolAccumulation[pump.pump_name]["timeStamp"] = curTime;
                    currVolAccumulation[pump.pump_name]["curRate"] = rate;
                }else{
                    currVolAccumulation[pump.pump_name]["curRate"] = rate;
                }
                serialBus.write(output);
                res.end();
            }
        })
});

router.post('/pumps/run/:name',function(req,res,next){
    //need to decide how to tell it what speed 
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

router.post('/modes/delete',function(req,res,next){
    var modeName = req.body["mode_name"];
    modeTable.destroy({
        where:{
            mode_name: modeName
        }
    });
    res.end();
});

router.post('/pumps/add',function(req,res,next){
    pumpTable.create({pump_name: req.body.pump_name, driver_code: req.body.driver_code, syringe_diam:req.body.syringe_diam,default_rate: req.body.default_rate})
        .then(function(pump) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(pump));
        });
});

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
