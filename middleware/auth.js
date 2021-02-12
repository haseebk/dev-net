const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  /**
   * Obtain token from header
   */
  const token = req.header("x-auth-token");

  /**
   * Account for no token
   */
  if (!token) {
    return res.status(401).json({
      msg: "No token was found - authorization denied",
    });
  }

  /**
   * Decode and verify token
   */
  try {
    jwt.verify(token, config.get("jwtSecret"), (error, decoded) => {
      if (error) {
        return res.status(401).json({ msg: "Token is not valid" });
      } else {
        req.user = decoded.user;
        next();
      }
    });
  } catch (err) {
    console.error("something wrong with auth middleware");
    res.status(500).json({ msg: "Server Error" });
  }
};
