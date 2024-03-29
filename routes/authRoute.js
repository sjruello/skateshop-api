const router = require("express").Router();
const User = require("../models/User");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const cors = require("cors");

// REGISTER
router.post("/register", cors(), async (req, res) => {
  // console.info("GET /register");
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    password: CryptoJS.AES.encrypt(req.body.password, process.env.PASS_SECRET).toString(),
  });

  try {
    const savedUser = await newUser.save();
    // console.log(savedUser);
    const accessToken = jwt.sign(
      {
        id: savedUser._id,
        isAdmin: savedUser.isAdmin,
      },
      process.env.JWT_KEY,
      { expiresIn: "3d" }
    );

    const { password, ...others } = savedUser._doc;
    res.status(200).json({ others, accessToken });
    // res.status(201).json(savedUser);
  } catch (err) {
    console.log(err, "Register user failed.");
    res.status(500).json(err);
  }
});

// LOGIN
router.post("/login", cors(), async (req, res) => {
  console.info("POST /login");
  try {
    const user = await User.findOne({ username: req.body.username });
    !user && res.status(401).json("Incorrect credentials!");

    const hashedPW = CryptoJS.AES.decrypt(user.password, process.env.PASS_SECRET);
    const originalPW = hashedPW.toString(CryptoJS.enc.Utf8);

    const accessToken = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_KEY,
      { expiresIn: "3d" }
    );

    const inputPassword = req.body.password;

    originalPW != inputPassword && res.status(401).json("Incorrect credentials!");

    const { password, ...others } = user._doc; // remove pw off response
    res.status(200).json({ others, accessToken });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
