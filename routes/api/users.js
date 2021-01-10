const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator/check");

/**
 * @route   POST api/user
 * @desc    Register user
 * @access  Public
 */
router.post("/", (req, res) => {
  [
    check("name", "Please enter a name").not().isEmpty(),
    check("email", "Please enter a valid email address.").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters."
    ).isLength({ min: 6 }),
  ],
    (req, res) => {
      const errors = validationResult(req);
      /**
       * If errors occured, log them and return json containing said errors
       */
      if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(400).json({ errors: errors.array });
      }
    };
  console.log(req.body);
  res.send("User route");
});

module.exports = router;
