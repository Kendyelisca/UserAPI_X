const { DataTypes } = require("sequelize");
const sequelize = require("../utils/connection");
const User = require("./User");

const EmailCode = sequelize.define("emailCode", {
  code: {
    type: DataTypes.STRING(64), // Specify the correct length
    allowNull: false,
    unique: true,
  },
  //userId
});

EmailCode.belongsTo(User);

module.exports = EmailCode;
