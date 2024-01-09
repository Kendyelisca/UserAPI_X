const catchError = require("../utils/catchError");
const User = require("../models/User");
const userService = require("../services/user.service");

const getAll = catchError(async (req, res) => {
  const results = await User.findAll();
  return res.json(results);
});

const create = catchError(async (req, res) => {
  try {
    const { email, password, username, role } = req.body;

    const result = await userService.createUser({
      email,
      password,
      username,
      role,
    });

    await userService.sendVerificationEmail({
      email,
      username,
      userId: result.id,
    });

    // Notify the user to check their email for verification
    const verificationMessage = `User created successfully. Please check your email (${email}) for account verification instructions.`;

    return res.status(201).json({ ...result.toJSON(), verificationMessage });
  } catch (error) {
    console.error("Error creating user:", error);

    return res.status(500).json({ message: error.message });
  }
});

const getOne = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await User.findByPk(id);
  if (!result) return res.sendStatus(404);
  return res.json(result);
});

const remove = catchError(async (req, res) => {
  const { id } = req.params;
  await User.destroy({ where: { id } });
  return res.sendStatus(204);
});

const update = catchError(async (req, res) => {
  const { id } = req.params;
  const result = await User.update(req.body, {
    where: { id },
    returning: true,
  });
  if (result[0] === 0) return res.sendStatus(404);
  return res.json(result[1][0]);
});

const verifyCode = catchError(async (req, res) => {
  try {
    const { code } = req.params;
    const updatedUser = await userService.verifyCode(code);
    const successMessage = "You have successfully been verified!";
    res.json({ message: successMessage, user: updatedUser });

    // Optionally, log the success message to the console
    console.log(successMessage);
    return res.json(updatedUser);
  } catch (error) {
    console.error("Error verifying code:", error);
    return res.status(500).json({ message: error.message });
  }
});

const confirmRegistrationHandler = catchError(async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      throw new Error("User ID not provided in the request parameters");
    }

    const updatedUser = await userService.confirmRegistration(userId);

    // Send a success message as part of the response
    const successMessage = "You have successfully completed the registration!";
    res.json({ message: successMessage, user: updatedUser });

    // Optionally, log the success message to the console
    console.log(successMessage);
  } catch (error) {
    console.error("Error in confirmRegistrationHandler:", error);
    return res.status(500).json({ message: error.message });
  }
});

const login = catchError(async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginUser(email, password);
    return res.json(result);
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = {
  getAll,
  create,
  getOne,
  remove,
  update,
  login,
  verifyCode,
  confirmRegistrationHandler,
};
