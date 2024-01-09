const express = require("express");
const session = require("express-session");
const passport = require("passport");
const authRouter = express.Router();

// express-session middleware
authRouter.use(
  session({
    secret: process.env.TOKEN_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize passport after setting up the session middleware
authRouter.use(passport.initialize());
authRouter.use(passport.session());

// Google authentication route
authRouter.route("/google").get(
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google callback route
authRouter
  .route("/google/callback")
  .get(
    passport.authenticate("google", { failureRedirect: "users/login" }),
    function (req, res) {
      // Successful authentication, redirect home.
      res.redirect("/auth/google/protected");
    }
  );

authRouter.route("/google/protected").get((req, res) => {
  if (req.isAuthenticated()) {
    // If the user is authenticated, access user information from req.user
    const { username } = req.user;

    // Display a welcome message with the user's name
    res.send(`Welcome to project x, ${username}!`);
  } else {
    // If the user is not authenticated, redirect to the login page
    res.redirect("/users/login");
  }
});

authRouter.route("/logout").get((req, res) => {
  // Logout the user
  req.logout((err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Error during logout", error: err });
    }

    // Redirect to the login page or any other appropriate page
    res.redirect("/users/login");
  });
});

module.exports = authRouter;
