'use strict';
module.exports = function(sequelize, DataTypes) {
  var pump = sequelize.define('pump', {
    pump_name: DataTypes.STRING,
    driver_code: DataTypes.STRING,
    current_rate: DataTypes.FLOAT,
    syringe_diam: DataTypes.FLOAT
  }, {
    classMethods: {
      associate: function(models) {
        pump.belongsToMany(models.mode,{through: 'pump_mode_rate'})
      }
    }
  });
  return pump;
};