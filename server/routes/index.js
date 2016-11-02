var express = require('express');
var models  = require('../models');
var router = express.Router();
var serialBus = require('../serialBus');

var pumpTable = models.pump;
var modeTable = models.mode;
var pumpModeRateTable = models.pump_mode_rate;

serialBus.initialize();

process.on('uncaughtException', (err) => {
    console.log(err);
});

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
                pump = pump[0];
                var output = pump.driver_code + "CLV\r";
                serialBus.write(output);
                res.end();
            }
        });
});

router.post('/pumps/updateSyringe',function(req,res,next){
    var pumpName = req.body.pumpName;
    var syringeDiam = req.body.syringeDiam;
    pumpTable.findAll({where: {pump_name:pumpName}})
        .then(function(pumps){
            if(pumps) {
                var pump = pump[0];
                pump.update({syringe_diam: syringeDiam}).then(function () {
                    var output = pump.driver_code + "MMD " + syringeDiam + "\r";
                    serialBus.write(output);
                    res.end();
                });
            }
        })
});

router.post('/pumps/updateRate',function(req,res,next){
    var pumpName = req.body.pumpName;
    var rate = parseFloat(req.body.rate).toFixed(3);
    pumpTable.findAll({where: {pump_name:pumpName}})
        .then(function(pumps){
            if(pumps) {
                var pump = pump[0];
                pump.update({current_rate: rate}).then(function () {
                    var output = pump.driver_code + "ULH " + rate + "\r";
                    serialBus.write(output);
                    res.end();
                });
            }
        })
});

/*
 router.post('/pumps/runAll',function(req,res,next){
 pumpTable.findAll()
 .then(function(pumps){
 pumps.forEach(
 (element) => {
 element.updateAttributes({current_rate: element.default_rate});
 var output = element.driver_code + "RUN\r";
 serialBus.write(output);
 res.end();
 }
 );
 });
 })

 router.post('/pumps/stopAll',function(req,res,next){
 var pumpsToStop;
 //find pumps that are on and update thier curRate to 0
 pumpTable.findAll({where: {current_rate: {$gt: 0}}})
 .then(function(pumps){
 if(pumps){
 pumpsToStop = pumps;
 pumps.forEach(
 (element) => {
 element.updateAttributes({current_rate: 0});
 var output = element.driver_code + "STP\r";
 serialBus.write(output);
 res.end();
 }
 );
 }
 });
 });
 */


router.post('/pumps/run/:name',function(req,res,next){
    //need to decide how to tell it what speed 
    var pumpName = req.params.name;
    var rate;
    pumpTable.findAll({where: {pump_name: pumpName}})
        .then(function(pump){
            pump = pump[0];
            var output = pump.driver_code + "RUN\r";
            serialBus.write(output);
            res.end();
        })
})

router.post('/pumps/stop/:name',function(req,res,next){
    var pumpName = req.params.name;
    pumpTable.findAll({where: {pump_name: pumpName}})
        .then(function(pump){
            //use pump DriverCode to tell pump to stop
            pump = pump[0];
            pump.updateAttributes({current_rate: 0});
            var output = pump.driver_code + "STP\r";
            serialBus.write(output);
            res.end();
        })
})

router.post('/modes/run/:name',function(req,res,next){
    var modeName = req.params.name;
    var response = {};
    response.pumps = new Array();

    pumpModeRateTable.findAll({where: {modeModeName: modeName}})
        .then(function(pumpModeRates){
            pumpModeRates.forEach(
                (element) => {
                pumpTable.findAll({where: {pump_name: element.pumpPumpName}}).then(function (pump) {
                pump[0].updateAttributes({current_rate: element.rate})
                var output = pump[0].driver_code + "RUN\r";
                serialBus.write(output);
            });
            response.pumps.push({pumpName: element.pumpPumpName,rate:element.rate});
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
    pumpTable.create({pump_name: req.body.pump_name, driver_code: req.body.driver_code})
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
