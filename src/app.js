const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const router = require("./routes");
const errorHandler = require("./utils/errorHandler");
require("dotenv").config();

const app = express();

// Middlewares
app.use(express.json());
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(cors());

// express-session middleware
app.use(
  session({
    secret: process.env.TOKEN_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize passport after setting up the session middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(router);
app.get("/", (req, res) => {
  return res.send("Welcome to express!");
});

app.use(errorHandler);

module.exports = app;
