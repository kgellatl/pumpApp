var express = require('express');
var models  = require('../models');

var router = express.Router();
var pumpTable = models.pump;
var modeTable = models.mode;
var pumpModeRateTable = models.pump_mode_rate;

/* GET home page. */
router.get('/', function(req, res, next) {
  pumpTable.findAll().then(function(pumps){
    modeTable.findAll().then(function(modes){
    res.render('index', { pumps: pumps, modes: modes });
    })
    });
});

router.post('/pumps/add',function(req,res,next){
  pumpTable.build({pump_name: req.body.pump_name, driver_code: req.body.driver_code})
            .save(['pump_name','driver_code'])
            .success(function(pump) {
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

router.post('/modes/add',function(req,res,next){
   var payLoad = req.body;
   var modeName = payLoad["mode_name"];
   delete payLoad['modeName'];
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
   
module.exports = router;
