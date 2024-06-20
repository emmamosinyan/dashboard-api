const User = require("../model/user");
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const jwtSecret =
  "168c5b42971ceb557aadf079d734121ce7ba16cfe88367bf6d406f42dbf4f51bcf63ba";

const updateUserSchema = Joi.object({
  _id: Joi.string().required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  age: Joi.number().integer().min(1).max(120).required(),
  country: Joi.string()
    .valid("Armenia", "France", "United Kingdom", "Australia", "Germany")
    .required(),
});

module.exports.signUp = async (req, res, next) => {
  const { email, password, firstName, lastName, age, country } = req.body;
  if (password.length < 6) {
    return res.status(400).json({ message: "Password less than 6 characters" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      age,
      country,
    });

    const maxAge = 3 * 60 * 60;
    const token = jwt.sign(
      {
        id: user._id,
        email,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        country: user.country,
      },
      jwtSecret,
      {
        expiresIn: maxAge,
      }
    );

    const userData = user.toJSON();

    delete userData.password;

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
    });

    res.status(200).json({
      message: "User created successfully",
      user: userData,
      token,
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(401).json({
      message: "User creation failed",
      error: err.message,
    });
  }
};

module.exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "Email or password not present",
    });
  }
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Login unsuccessful",
        error: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Login unsuccessful",
        error: "Invalid password",
      });
    }

    const maxAge = 3 * 60 * 60;

    const token = jwt.sign(
      {
        id: user._id,
        email,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        country: user.country,
      },
      jwtSecret,
      {
        expiresIn: maxAge,
      }
    );

    const userData = user.toJSON();

    delete userData.password;

    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: maxAge * 1000,
    });

    res.status(200).json({
      message: "Login successful",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(400).json({
      message: "An error occurred during login",
      error: error.message,
    });
  }
};

module.exports.update = async (req, res, next) => {
  const { error, value } = updateUserSchema.validate(req.body);

  if (error) {
    return res
      .status(400)
      .json({ message: "Validation Failed", details: error.details });
  }

  const { firstName, lastName, age, country, _id } = value;

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.age = age;
    user.country = country;

    const updatedUser = await user.save();

    res.status(201).json({ message: "Update successful", user: updatedUser });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Update Failed", error: err.message });
  }
};

module.exports.getProfile = async (req, res) => {
  const usrData = jwt.verify(req.headers.token, jwtSecret);

  console.log('--------------------', usrData);
  res.status(200).send({ user: usrData });
}

module.exports.getAllProfiles = async (req, res) => {
  const profiles = await User.find({}).select('-password');

  res.send(profiles)
}
