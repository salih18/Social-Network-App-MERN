const express = require('express');
const request = require('request');
const router = express.Router();
const config = require('config');

const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @router GET api/profile/me
// @desc   Get current users profile
// @access Private

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', [
      'name',
      'avatar',
    ]);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router POST api/profile
// @desc   Create or update user profile
// @access Private

router.post('/', auth, async (req, res) => {
  await check('status', 'Status is required')
    .not()
    .isEmpty()
    .run(req);
  await check('skills', 'Skills is required')
    .not()
    .isEmpty()
    .run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin,
  } = req.body;

  // Build profile object
  const profileFields = {
    user: req.user.id,
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    social: { youtube, twitter, facebook, instagram, linkedin },
    skills: skills.split(',').map(skill => skill.trim()),
  };

  try {
    let profile = await Profile.findOne({ user: req.user.id });

    // Update a profile if exists

    if (profile) {
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { upsert: true, omitUndefined: true, new: true },
      );

      return res.json(profile);
    }

    // Create a profile if not exists

    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router GET api/profile
// @desc   Get all profiles
// @access Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router GET api/profile/user/:user_id
// @desc   Get profile by user ID
// @access Public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', [
      'name',
      'avatar',
    ]);

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @router DELETE api/profile
// @desc   Delete profile, user & posts
// @access Private

router.delete('/', auth, async (req, res) => {
  try {
    // Remove user posts
    await Post.deleteMany({ user: req.user.id });

    // remove profile
    await Profile.findOneAndRemove({ user: req.user.id });

    // remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router PUT api/profile/experience
// @desc   Add profile experience
// @access Private

router.put('/experience', auth, async (req, res) => {
  await check('title', 'Title is required')
    .not()
    .isEmpty()
    .run(req);
  await check('company', 'Company is required')
    .not()
    .isEmpty()
    .run(req);
  await check('from', 'From date is required')
    .not()
    .isEmpty()
    .run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, company, location, from, to, current, description } = req.body;

  const newExp = {
    title,
    company,
    location,
    from,
    to,
    current,
    description,
  };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // add experience
    profile.experience.unshift(newExp);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router DELETE api/profile/experience/:exp_id
// @desc   Delete experience from profile
// @access Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
    // remove experience
    profile.experience.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router PUT api/profile/education
// @desc   Add profile education
// @access Private

router.put('/education', auth, async (req, res) => {
  await check('school', 'School is required')
    .not()
    .isEmpty()
    .run(req);
  await check('degree', 'Degree is required')
    .not()
    .isEmpty()
    .run(req);
  await check('fieldofstudy', 'Field of study is required')
    .not()
    .isEmpty()
    .run(req);
  await check('from', 'From date is required')
    .not()
    .isEmpty()
    .run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { school, degree, fieldofstudy, from, to, current, description } = req.body;

  const newEdu = {
    school,
    degree,
    fieldofstudy,
    from,
    to,
    current,
    description,
  };

  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // add education
    profile.education.unshift(newEdu);

    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router DELETE api/profile/education/:edu_id
// @desc   Delete education from profile
// @access Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    //Get remove index
    const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
    // remove experience
    profile.education.splice(removeIndex, 1);
    await profile.save();

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @router GET api/profile/github/:username
// @desc   Get user repos from Github
// @access Public

router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}
      &client_secret=
      ${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' },
    };

    request(options, (error, response, body) => {
      if (error) return console.error(error);
      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: 'No Github profile found' });
      }
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
