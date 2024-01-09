const { DataTypes } = require("sequelize");
const sequelize = require("../utils/connection");

const User = sequelize.define("user", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  registrationCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  role: {
    type: DataTypes.ENUM("user", "admin", "company"),
    defaultValue: "user",
    allowNull: false,
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  lockUntil: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
});

module.exports = User;
