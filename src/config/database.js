const { Sequelize } = require("sequelize");

// Configuration of the database connection
const sequelize = new Sequelize({
  dialect: "postgres",
  host: "localhost",
  username: "root",
  password: "",
  database: "project_x_db",
});
