const { DataTypes } = require("sequelize");

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
module.exports = (sequelize) => {
  sequelize.define("UserNode", {
    // The following specification of the 'id' attribute could be omitted
    // since it is the default.
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    contribution: {
      type: DataTypes.FLOAT,
    },
    movespeed: {
      type: DataTypes.FLOAT,
    },
    workspeed: {
      type: DataTypes.FLOAT,
    },
    luck: {
      type: DataTypes.FLOAT,
    },
    lodging: {
      type: DataTypes.STRING,
    },
    group: {
      type: DataTypes.TEXT,
    },
    taken: {
      type: DataTypes.BOOLEAN,
    },
  });
};
