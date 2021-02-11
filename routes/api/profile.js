const express = require("express");
const request = require("request");
const config = require("config");
const router = express.Router();
const auth = require("../../middleware/auth");
const { body, validationResult } = require("express-validator");

const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Post = require("../../models/Post");

/**
 * @route   GET api/profile/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({
        msg: "No profile exists for this user.",
      });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

/**
 * @route   POST api/profile
 * @desc    Create or update a user profile
 * @access  Private
 */
router.post(
  "/",
  [
    auth,
    [
      body("status", "Status is required").not().isEmpty(),
      body("skills", "Skills are required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const {
      company,
      website,
      location,
      bio,
      status,
      skills,
      github,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
    } = req.body;

    /**
     * Create profile object
     */
    const profileFields = {};
    profileFields.user = req.user.id;

    // note to self: can use forEach to reduce line count and simplify process
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (github) profileFields.github = github;
    if (skills) {
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
    }

    /**
     * Create social object
     */
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;

    try {
      let profile = await Profile.findOne({
        user: req.user.id,
      });
      /**
       * Update if a profile exists
       */
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          {
            user: req.user.id,
          },
          {
            $set: profileFields,
          },
          {
            new: true,
          }
        );

        return res.json(profile);
      }
      /**
       * Create new profile if none currently exists
       */
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }
);

/**
 * @route   GET api/profile
 * @desc    Get all user profiles
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (error) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   GET api/profile/user/:user_id
 * @desc    Get user profile by user ID
 * @access  Public
 */
router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({
        msg: "Profile not found!",
      });
    }

    res.json(profile);
  } catch (error) {
    console.error(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({
        msg: "Profile not found!",
      });
    }
    res.status(500).send("Server Error");
  }
});

/**
 * @route   DELETE api/profile
 * @desc    Delete profile, user, and posts
 * @access  Private
 */
router.delete("/", auth, async (req, res) => {
  try {
    // Remove user posts
    await Post.deleteMany({ user: req.user.id });

    // Remove profile
    await Profile.findOneAndRemove({
      user: req.user.id,
    });
    // Remove user
    await User.findOneAndRemove({
      _id: req.user.id,
    });
    res.json({
      msg: "User deleted",
    });
  } catch (error) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   PUT api/profile/experience
 * @desc    Add profile experience
 * @access  Private
 */
router.put(
  "/experience",
  [
    auth,
    [
      body("title", "Title is required.").not().isEmpty(),
      body("company", "Company is required.").not().isEmpty(),
      body("from", "From date is required.").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };
    // note to self: add update functionality for experience

    try {
      const profile = await Profile.findOne({
        user: req.user.id,
      });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

/**
 * @route   DELETE api/profile/experience/:exp_id
 * @desc    Delete profile experience
 * @access  Private
 */
router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });

    // Index of experience to be removed
    const removeIndex = profile.experience
      .map((item) => item.id)
      .indexOf(req.params.exp_id);

    // Remove experience
    profile.experience.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   PUT api/profile/education
 * @desc    Add profile education
 * @access  Private
 */
router.put(
  "/education",
  [
    auth,
    [
      body("school", "School is required.").not().isEmpty(),
      body("degree", "Degree is required.").not().isEmpty(),
      body("fieldOfStudy", "Field of Study is required.").not().isEmpty(),
      body("from", "From date is required.").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description,
    };
    // note to self: add update functionality for education

    try {
      const profile = await Profile.findOne({
        user: req.user.id,
      });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Server Error");
    }
  }
);

/**
 * @route   DELETE api/profile/education/:edu_id
 * @desc    Delete profile education
 * @access  Private
 */
router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });

    // Index of education to be removed
    const removeIndex = profile.education
      .map((item) => item.id)
      .indexOf(req.params.edu_id);

    // Remove experience
    profile.education.splice(removeIndex, 1);

    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

/**
 * @route   GET api/profile/github/:username
 * @desc    Get user repo from GitHub
 * @access  Public
 */
router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "githubClientId"
      )}&client_secret=${config.get("githubSecret")}`,
      method: "GET",
      headers: {
        "user-agent": "node.js",
      },
    };
    request(options, (error, response, body) => {
      if (error) {
        console.error(error);
      }
      if (response.statusCode !== 200) {
        return res.status(404).json({
          msg: "No GitHub profile was found",
        });
      }

      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
