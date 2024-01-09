// index.js
const express = require("express");
const session = require("express-session");
const passport = require("../auth/auth");
const userRouter = require("./user.router");
const authRouter = require("./auth.router");

const router = express.Router();

// Middleware for initializing Passport
console.log("Setting up express app and middleware");

router.use(passport.initialize());
router.use(passport.session());

router.use("/users", userRouter);
router.use("/auth", authRouter);

module.exports = router;
