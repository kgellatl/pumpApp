'use strict';
module.exports = function(sequelize, DataTypes) {
  var mode = sequelize.define('mode', {
    mode_name: {
        type: DataTypes.STRING,
        primaryKey:true,
        allowNull:false
    }
  }, {
    classMethods: {
      associate: function(models) {
        mode.belongsToMany(models.pump,{through: 'pump_mode_rate'})
      }
    }
  });
  return mode;
};