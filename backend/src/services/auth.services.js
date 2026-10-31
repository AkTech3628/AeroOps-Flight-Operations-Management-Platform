const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signup = async (data) => {

  const existingUser =
    await User.findOne({
      email: data.email
    });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hash =
    await bcrypt.hash(
      data.password,
      10
    );

  return await User.create({
    email: data.email,
    password: hash
  });
};

const login = async (email, password) => {

  const user =
    await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid Credentials");
  }

  const match =
    await bcrypt.compare(
      password,
      user.password
    );

  if (!match) {
    throw new Error("Invalid Credentials");
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d"
    }
  );
};

module.exports = {
  signup,
  login
};