const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const config = require("config");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const User = require("../../models/User");

/**
 * @route   GET api/auth
 * @desc    Get user by token
 * @access  Public
 */
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("A server error has occurred");
  }
});

/**
 * @route   POST api/auth
 * @desc    Verify and authenticate user & get token
 * @access  Public
 */
router.post(
  "/",
  [
    body("email", "Please enter a valid email address.").isEmail(),
    body("password", "Password is required.").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    /**
     * If errors occured, log them and return json containing said errors
     */
    if (!errors.isEmpty()) {
      console.log(errors);
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    try {
      /**
       * Check to see if user exists
       */
      let user = await User.findOne({
        email,
      });

      if (!user) {
        return res.status(400).json({
          errors: [
            {
              msg: "Invalid credentials!",
            },
          ],
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          errors: [
            {
              msg: "Invalid credentials!",
            },
          ],
        });
      }

      /**
       * Return jsonwebtoken
       */
      const payload = {
        user: {
          id: user.id,
        },
      };
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
          });
        }
      );
    } catch (err) {
      console.log(err);
      res.status(500).send("Server error has occurred");
    }
  }
);

module.exports = router;
