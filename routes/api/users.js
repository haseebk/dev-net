const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const normalize = require("normalize-url");
const { body, validationResult } = require("express-validator");

/**
 * @route   POST api/user
 * @desc    Register user
 * @access  Public
 */
router.post(
  "/",

  body("name", "Please enter a name.").notEmpty(),
  body("email", "Please enter a valid email address.").isEmail(),
  body(
    "password",
    "Please enter a password with 6 or more characters."
  ).isLength({
    min: 6,
  }),

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

    const { name, email, password } = req.body;

    try {
      /**
       * Check to see if user exists
       */
      let user = await User.findOne({
        email,
      });

      if (user) {
        return res.status(400).json({
          errors: [
            {
              msg: "User already exists",
            },
          ],
        });
      }

      /**
       * Get user's profile gravatar
       */
      const avatar = normalize(
        gravatar.url(email, {
          s: "200",
          r: "pg",
          d: "mm",
        }),
        { forceHttps: true }
      );

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      /**
       * Encrypt user password
       */
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

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
