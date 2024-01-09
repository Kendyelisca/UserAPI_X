const { body } = require("express-validator");
const validFields = require("./validFields");

exports.createUserValidation = [
  body("username")
    .exists()
    .notEmpty()
    .withMessage("username cannot be empty")
    .isString()
    .withMessage("type username is string"),

  body("email")
    .exists()
    .notEmpty()
    .withMessage("email cannot be empty")
    .isString()
    .withMessage("type email is string")
    .isEmail()
    .withMessage("Invalid email format. Example: user@example.com"),

  body("password")
    .isString()
    .withMessage("type password is string")
    .isStrongPassword()
    .withMessage(
      "Weak password. Include a special character, uppercase, and lowercase letters."
    )
    .custom(async (value) => {
      // Check if the password meets a specific length requirement
      if (value.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }
      return true;
    }),
  validFields,
];

exports.loginUserValidation = [
  body("email")
    .exists()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .isString()
    .withMessage("Type email is string")
    .isEmail()
    .withMessage("Invalid email format. Example: user@example.com"),

  body("password").isString().withMessage("Type password is string"),

  validFields,
];
