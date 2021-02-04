const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const {
    body,
    validationResult
} = require('express-validator');

const Profile = require("../../models/Profile");
const User = require("../../models/User");

/**
 * @route   GET api/profile/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get("/me", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        }).populate("user", ["name", "avatar"]);

        if (!profile) {
            return res.status(400).json({
                msg: "No profile exists for this user."
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
router.post("/", [auth, [body("status", "Status is required").not().isEmpty(),
    body("skills", "Skills are required").not().isEmpty()
]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
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
        linkedin
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
        profileFields.skills = skills.split(",").map(skill => skill.trim());
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
            user: req.user.id
        });
        /**
         * Update if a profile exists
         */
        if (profile) {
            profile = await Profile.findOneAndUpdate({
                user: req.user.id
            }, {
                $set: profileFields
            }, {
                new: true
            });

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
});

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
            user: req.params.user_id
        }).populate("user", ["name", "avatar"]);

        if (!profile) {
            return res.status(400).json({
                msg: "Profile not found!"
            });
        }

        res.json(profile);
    } catch (error) {
        console.error(err.message);
        if (err.kind == "ObjectId") {
            return res.status(400).json({
                msg: "Profile not found!"
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


        // Remove profile
        await Profile.findOneAndRemove({
            user: req.user.id
        });
        // Remove user
        await User.findOneAndRemove({
            _id: req.user.id
        });
        res.json({
            msg: "User deleted"
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
router.put("/experience", [auth, [body('title', 'Title is required.').not().isEmpty(), body('company', 'Company is required.').not().isEmpty(), body('from', 'From date is required.').not().isEmpty()]], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }
    // note to self: add update functionality for experience

    try {
        const profile = await Profile.findOne({
            user: req.user.id
        });
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch (error) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;