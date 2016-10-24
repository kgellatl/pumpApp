var express = require('express');
var models  = require('../models');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  models.pump.findAll().then(function(pumps){
    res.render('index', { pumps: pumps });
  });
});

router.get('/pumps/add',function(req,res,next){
  models.pump.create({pump_name: req.pump_name, driver_code: req.driver_code
                      }).success(function(pump) {
                          res.setHeader('Content-Type', 'application/json');
                          res.send(JSON.stringify(pump));
                      });
    
});

module.exports = router;
