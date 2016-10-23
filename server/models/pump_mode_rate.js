'use strict';
module.exports = function(sequelize, DataTypes) {
  var pump_mode_rate = sequelize.define('pump_mode_rate', {
    rate: DataTypes.FLOAT
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return pump_mode_rate;
};