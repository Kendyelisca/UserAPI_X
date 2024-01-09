const {
  getAll,
  create,
  getOne,
  remove,
  update,
  verifyCode,
  login,
  confirmRegistrationHandler,
} = require("../controllers/user.controller");
const userValidation = require("../validations/user.validation");
const express = require("express");
const { checkRole } = require("../middlewares/rbacMiddleware"); // Import the RBAC middleware
const verifyJWT = require("../utils/verifyJWT");

const userRouter = express.Router();

userRouter.route("/").get(verifyJWT, checkRole(["admin", "company"]), getAll); // Accessible by admin and company roles

userRouter.route("/register").post(userValidation.createUserValidation, create); // No role check for registration

userRouter.route("/verify/:code").get(verifyCode); // No role check for verification

userRouter.route("/complete_registration/:id").get(confirmRegistrationHandler); // No role check for incomplete registration

userRouter
  .route("/:id")
  .get(verifyJWT, checkRole(["admin", "company"]), getOne) // Accessible by admin and company roles
  .delete(verifyJWT, checkRole(["admin", "company"]), remove) // Accessible by admin and company roles
  .put(verifyJWT, checkRole(["admin", "company"]), update); // Accessible by admin and company roles

userRouter.route("/login").post(userValidation.loginUserValidation, login);

module.exports = userRouter;
