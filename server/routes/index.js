var express = require('express');
var models  = require('../models');

var router = express.Router();
var pumpTable = models.pump;

/* GET home page. */
router.get('/', function(req, res, next) {
  pumpTable.findAll().then(function(pumps){
    var modes = [{ mode_name:'prime beads'}]; 
    res.render('index', { pumps: pumps, modes: modes });
  });
});

router.post('/pumps/add',function(req,res,next){
  pumpTable.create({pump_name: req.body.pump_name, driver_code: req.body.driver_code
                      }).success(function(pump) {
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

module.exports = router;
