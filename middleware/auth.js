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
            msg: "No token was found - authorization denied"
        });
    }

    /**
     * Decode and verify token
     */
    try {
        const decoded = jwt.verify(token, config.get("jwtSecret"));
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({
            msg: "Invalid token"
        });
    }

}