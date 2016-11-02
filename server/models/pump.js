'use strict';
module.exports = function(sequelize, DataTypes) {
  var pump = sequelize.define('pump', {
    pump_name: 
    {
        type: DataTypes.STRING,
        primaryKey:true,
        allowNull:false
    },
    driver_code: {type: DataTypes.STRING,unique:true},
    syringe_diam: DataTypes.FLOAT,
    default_rate: { type: DataTypes.FLOAT,defaultValue:50 },
    isRunning: {type:DataTypes.BOOLEAN,defaultValue:false}
  }, {
    classMethods: {
      associate: function(models) {
        pump.belongsToMany(models.mode,{through: 'pump_mode_rate'})
      }
    }
  });
  return pump;
};