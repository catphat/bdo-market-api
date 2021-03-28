const { DataTypes } = require("sequelize");

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
module.exports = (sequelize) => {
  sequelize.define(
    "Node",
    {
      // The following specification of the 'id' attribute could be omitted
      // since it is the default.
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      image: {
        type: DataTypes.STRING,
      },
      contribution: {
        type: DataTypes.FLOAT,
      },
      cpAdd: {
        type: DataTypes.FLOAT,
      },
      workload: {
        type: DataTypes.FLOAT,
      },
      workspeed: {
        type: DataTypes.FLOAT,
      },
      movespeed: {
        type: DataTypes.FLOAT,
      },
      luck: {
        type: DataTypes.FLOAT,
      },
      distances: {
        type: DataTypes.TEXT,
      },
      lodging: {
        type: DataTypes.STRING,
      },
      region: {
        type: DataTypes.STRING,
      },
      group: {
        type: DataTypes.TEXT,
      },
      taken: {
        type: DataTypes.BOOLEAN,
      },
    },
    {
      timestamps: false,
    }
  );
};
