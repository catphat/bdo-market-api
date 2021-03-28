const { DataTypes } = require("sequelize");

// We export a function that defines the model.
// This function will automatically receive as parameter the Sequelize connection object.
module.exports = (sequelize) => {
  sequelize.define("User", {
    // The following specification of the 'id' attribute could be omitted
    // since it is the default.
    sub: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.STRING,
    },
    username: {
      allowNull: false,
      type: DataTypes.STRING,
    },
    name: {
      allowNull: true,
      type: DataTypes.STRING,
    },
    region: {
      allowNull: false,
      type: DataTypes.STRING(10),
    },
    showFishing: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
    },
    activeHours: {
      allowNull: false,
      type: DataTypes.INTEGER,
    },
    disabledMaterials: {
      allowNull: true,
      type: DataTypes.STRING,
    },
    overrideMaterials: {
      allowNull: true,
      type: DataTypes.STRING,
    },
  });
};
