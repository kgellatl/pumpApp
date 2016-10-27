var express = require('express');
var models  = require('../models');
var five = require("johnny-five");
var raspi = require("raspi");
var Serial = require('raspi-serial').Serial;

var router = express.Router();

var pumpTable = models.pump;
var modeTable = models.mode;
var pumpModeRateTable = models.pump_mode_rate;

raspi.init(function(){
  
var serial = new Serial('/dev/ttyUSB0');

serial.open( () => {
/* GET home page. */
router.get('/', function(req, res, next) {
  pumpTable.findAll().then(function(pumps){
        modeTable.findAll().then(function(modes){
            pumpModeRateTable.findAll().then(function(pumpModeRates){
                res.render('index', { pumps: pumps, modes: modes, pumpModeRates: pumpModeRates });
            });
        })
    });
});

router.get('/pumps/getAccVol/:name',function(req,res,next){
    res.setHeader('Content-Type', 'application/json');
    res.send({accVol:5});
})

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
    });
})

router.post('/pumps/stopAll',function(req,res,next){
    var pumpsToStop;
    //find pumps that are on and update thier curRate to 0
    pumpTable.findAll({where: {current_rate: {$gt: 0}}})
             .then(function(pumps){
                if(pumps){
                   pumpsToStop = pumps;
                   pumps.forEach( (element) => element.updateAttributes({current_rate: 0}) );                
                }    
             });
    console.log(pumpsToStop);
    
    // Need to add code to tell each pump to stop
});

router.post('/pumps/updateSyringe',function(req,res,next){
    var pumpName = req.body.pumpName;
    var syringeDiam = req.body.syringeDiam;
    pumpTable.findAll({where: {pump_name:pumpName}})
             .then(function(pump){
                 pump.updateAttributes({syringe_diam:syringeDiam});
                //send syringe update to pump                 
             })
})

router.post('/pumps/runAll',function(req,res,next){
    var pumpsWithDefautRates = {};
    pumpTable.findAll()
             .then(function(pumps){
                  pumps.forEach( 
                  (element) => {
                  element.updateAttributes({current_rate: element.default_rate});
                  pumpsWithDefautRates[element.pump_name] = element.default_rate;
                  });
              });
    console.log(pumpsWithDefautRates);
})

router.post('/pumps/run/:name',function(req,res,next){
    //need to decide how to tell it what speed 
    var pumpName = req.params.name;
    var rate; 
    pumpTable.findAll({where: {pump_name: pumpName}})
             .then(function(pump){
                 var output = pump.driver_code + "RUN\r";
                 serial.write(output);  
             })
})

router.post('/pumps/stop/:name',function(req,res,next){
    var pumpName = req.params.name;
    pumpTable.findAll({where: {pump_name: pumpName}})
             .then(function(pump){
                //use pump DriverCode to tell pump to stop
                var output = pump.driver_code + "STP\r";
                serial.write(output);
             })
})

router.post('/modes/run/:name',function(req,res,next){
    var modeName = req.params.name;
    pumpModeRateTable.findAll({where: {modeModeName: modeName}})
                     .then(function(pumpModeRates){
                         pumpModeRates.forEach(
                         (element) => {
                             pumpTable.updateAttributes({current_rate: element.rate})
                             //need to add call to each pump here
                         })
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
            })

            });
            
router.post('/modes/delete',function(req,res,next){
    var modeName = req.body["mode_name"];
    modeTable.destroy({
        where:{
            mode_name: modeName
        }
    });
});
});
});  
module.exports = router;
