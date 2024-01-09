// rbacMiddleware.js
const checkRole = (roles) => {
  return (req, res, next) => {
    const { user } = req;

    if (!user.role || !roles.includes(user.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource.",
      });
    }

    next();
  };
};

module.exports = { checkRole };
