const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const { sendWelcomeEmail } = require("../services/user.service");
require("dotenv").config();
const frontbaseUrl = process.env.FRONTENDBASE_URL;

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${frontbaseUrl}/auth/google/callback`,
      passReqToCallback: true,
      scope: ["profile", "email"],
    },
    async (req, accessToken, refreshToken, profile, cb) => {
      try {
        const user = await User.findOne({ where: { googleId: profile.id } });

        if (user) {
          // Existing user
          user.isNewUser = false;
          await user.save(); // Update the user to mark as not a new user
          return cb(null, user);
        } else {
          // New user
          const newUser = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            username: `${profile.name.givenName} ${profile.name.familyName}`,
            isVerified: true,
            registrationCompleted: true,
          });

          newUser.isNewUser = true;
          await newUser.save(); // Mark the user as a new user

          // Send welcome email to the new user
          await sendWelcomeEmail(newUser.email, newUser.username);

          return cb(null, newUser);
        }
      } catch (error) {
        console.error("Error during Google authentication:", error);
        return cb(error, null);
      }
    }
  )
);

module.exports = passport;
