const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const EmailCode = require("../models/EmailCode");
const catchError = require("../utils/catchError");

const frontbaseUrl = process.env.FRONTENDBASE_URL;
//create user logic
const createUser = async ({ email, password, username, role }) => {
  try {
    // Check if username is already taken
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      throw new Error("Username is already taken");
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Creating user...");
    const result = await User.create({
      email,
      password: hashedPassword,
      username,
      role,
    });

    return result;
  } catch (error) {
    throw error; // Rethrow the error for more detailed handling in the controller
  }
};

const sendVerificationEmail = async ({ email, username, userId }) => {
  const code = require("crypto").randomBytes(32).toString("hex");
  console.log("Generated code length:", code.length);

  const link = `${frontbaseUrl}/users/verify/${code}`;

  console.log("Sending verification email...");
  await sendEmail({
    to: email,
    subject: "Verification email for Project X",
    html: ` <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3498db;">Hello ${username}</h1>
      <p style="font-size: 16px;">Welcome to our Project x App. Please verify your account by clicking the button below:</p>
      <a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;" target="_blank">Verify Account</a>
      <p style="font-size: 14px; margin-top: 20px;">If the button above doesn't work, you can also click the link below:</p>
      <a href="${link}" style="color: #3498db; text-decoration: none;" target="_blank">${link}</a>
      <p style="font-size: 14px; margin-top: 20px;">Thank you!</p>
    </div>
      `,
  });

  console.log("Verification email sent.");

  console.log("Creating email code...");
  await EmailCode.create({ code, userId });

  console.log("Email code created successfully.");
};

//verify code logic

const verifyCode = async (code) => {
  console.log("Verifying code:", code);

  const codeFound = await EmailCode.findOne({ where: { code } });

  if (!codeFound) {
    console.log("Code not found");
    throw new Error("Invalid code");
  }

  console.log("Code found:", codeFound);

  // Update isVerified to true
  const [verifiedUpdateCount, verifiedUpdateRows] = await User.update(
    { isVerified: true },
    { where: { id: codeFound.userId }, returning: true }
  );

  if (
    verifiedUpdateCount === 0 ||
    !verifiedUpdateRows ||
    verifiedUpdateRows.length === 0
  ) {
    console.log("No rows affected during isVerified update");
    throw new Error("Invalid code");
  }

  // Set registrationCompleted to true
  const [completedUpdateCount, completedUpdateRows] = await User.update(
    { registrationCompleted: true },
    { where: { id: codeFound.userId }, returning: true }
  );

  if (
    completedUpdateCount === 0 ||
    !completedUpdateRows ||
    completedUpdateRows.length === 0
  ) {
    console.log("No rows affected during registrationCompleted update");
    throw new Error("Invalid code");
  }

  const updatedUser = completedUpdateRows[0];

  // Sending welcome email to the user
  console.log("Sending welcome email...");
  await sendEmail({
    to: updatedUser.email,
    subject: "Welcome to Project X",
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
         <h1 style="color: #3498db;">Welcome ${updatedUser.username}!</h1>
         <p style="font-size: 16px;">Congratulations! Your account on Project X has been successfully verified.</p>
         <p style="font-size: 16px;">Thank you for joining us on this exciting journey!</p>
         <p style="font-size: 14px; margin-top: 20px;">Best regards,</p>
         <p style="font-size: 14px;">The Project X Team</p>
       </div>`,
  });

  console.log("Welcome email sent.");

  await codeFound.destroy();
  console.log("Verification successful");

  return updatedUser;
};

//login logic

const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Check if the account is locked
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingTime = Math.ceil((user.lockUntil - new Date()) / 1000); // Convert milliseconds to seconds
    throw new Error(
      `Account is locked. Please try again after ${remainingTime} seconds.`
    );
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    // Increment login attempts and check for lockout
    user.loginAttempts += 1;

    if (user.loginAttempts >= 3) {
      // Lock the account for 5 minutes (300 seconds) after 3 consecutive failed attempts
      user.lockUntil = new Date(Date.now() + 300 * 1000);
      user.loginAttempts = 0; // Reset login attempts

      await user.save(); // Save changes to the user model

      throw new Error(
        "Too many failed login attempts. Account is locked for 5 minutes."
      );
    }

    await user.save(); // Save incremented login attempts

    throw new Error("Invalid credentials");
  }

  // Reset login attempts upon successful login
  user.loginAttempts = 0;
  await user.save();

  // Check if the user's registration is incomplete
  if (!user.isVerified || !user.registrationCompleted) {
    const emailContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #3498db;">Complete Your Registration on Project X</h1>
    <p style="font-size: 16px;">You started the registration process on Project X but didn't complete it.</p>
    <p style="font-size: 16px;">Please click the button below to complete your registration:</p>
    <a href="${frontbaseUrl}/users/complete_registration/${user.id}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 10px;" target="_blank">Complete Registration</a>
    <p style="font-size: 14px; margin-top: 20px;">If the button above doesn't work, you can also click the link below:</p>
    <a href="${frontbaseUrl}/users/complete_registration/${user.id}" style="color: #3498db; text-decoration: none;" target="_blank">${frontbaseUrl}/users/complete_registration/${user.id}</a>
    <p style="font-size: 14px; margin-top: 20px;">Thank you!</p>
  </div>`;
    // Send incomplete registration notification
    console.log("Sending incomplete registration email...");
    await sendEmail({
      to: user.email,
      subject: "Complete Your Registration on Project X",
      html: emailContent,
    });

    console.log("Incomplete registration email sent.");
    throw new Error(
      "Incomplete registration. Please check your email to complete the registration process."
    );
  }

  // Continue with regular login logic
  const token = jwt.sign({ user }, process.env.TOKEN_SECRET, {
    expiresIn: "1d",
  });

  return { user, token };
};

const confirmRegistration = catchError(async (userId) => {
  try {
    console.log("Attempting to confirm registration for user ID:", userId);

    // Find the user by ID
    const user = await User.findByPk(userId);

    if (!user) {
      // User not found
      console.error("User not found during confirmation registration");
      throw new Error("User not found");
    }

    console.log("User found:", user);

    // Check if there is an associated code
    const codeFound = await EmailCode.findOne({ where: { userId: user.id } });

    if (!codeFound) {
      // Code not found
      console.error("Code not found during confirmation registration");
      throw new Error("Code not found");
    }

    console.log("Code found:", codeFound);

    if (user.isVerified) {
      // User is already verified
      console.error(
        "User is already verified during confirmation registration"
      );
      throw new Error("User is already verified");
    }

    // Update isVerified to true
    const [verifiedUpdateCount, verifiedUpdateRows] = await User.update(
      { isVerified: true },
      { where: { id: user.id }, returning: true }
    );

    if (
      verifiedUpdateCount === 0 ||
      !verifiedUpdateRows ||
      verifiedUpdateRows.length === 0
    ) {
      // No rows affected during isVerified update
      console.error(
        "Failed to update isVerified during confirmation registration"
      );
      throw new Error("Failed to update isVerified");
    }

    const updatedUser = verifiedUpdateRows[0];
    console.log("User successfully updated:", updatedUser);

    // Check if the welcome email has already been sent
    if (!user.registrationCompleted) {
      console.log("Sending welcome email...");
      await sendEmail({
        to: updatedUser.email,
        subject: "Welcome to Project X",
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
               <h1 style="color: #3498db;">Welcome ${updatedUser.username}!</h1>
               <p style="font-size: 16px;">Congratulations! Your account on Project X has been successfully verified.</p>
               <p style="font-size: 16px;">Thank you for joining us on this exciting journey!</p>
               <p style="font-size: 14px; margin-top: 20px;">Best regards,</p>
               <p style="font-size: 14px;">The Project X Team</p>
             </div>`,
      });

      // Update registrationCompleted to true
      await User.update(
        { registrationCompleted: true },
        { where: { id: updatedUser.id } }
      );

      console.log("Welcome email sent.");
    }

    // Destroy the email code record
    await codeFound.destroy();

    // Return the updated user
    console.log("User registration confirmed successfully:", updatedUser);
    return updatedUser;
  } catch (error) {
    console.error("Error confirming registration:", error);
    throw error; // Rethrow the error for handling in the calling function
  }
});

const sendWelcomeEmail = async (email, username) => {
  try {
    await sendEmail({
      to: email,
      subject: "Welcome to Project X",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
         <h1 style="color: #3498db;">Welcome ${username}!</h1>
         <p style="font-size: 16px;">Congratulations! Your account on Project X has been successfully verified.</p>
         <p style="font-size: 16px;">Thank you for joining us on this exciting journey!</p>
         <p style="font-size: 14px; margin-top: 20px;">Best regards,</p>
         <p style="font-size: 14px;">The Project X Team</p>
       </div>`,
    });

    console.log("Welcome email sent.");
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error; // Rethrow the error for handling in the calling function
  }
};

module.exports = {
  createUser,
  sendVerificationEmail,
  verifyCode,
  loginUser,
  confirmRegistration,
  sendWelcomeEmail,
};
