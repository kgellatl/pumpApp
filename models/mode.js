'use strict';
module.exports = function(sequelize, DataTypes) {
  var mode = sequelize.define('mode', {
    mode_name: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        mode.belongsToMany(models.pump,{through: 'pump_mode_rate'})
      }
    }
  });
  return mode;
};