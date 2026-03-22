const User = require("../models/user");
const bcrypt = require("bcryptjs")

// SIGNUP
exports.signup = async (req, res) => {

  try {

    const { name, email, password, role } = req.body

    // check if email exists
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered"
      })
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    })

    await newUser.save()

    res.status(201).json({
      message: "User registered successfully",
      user: newUser
    })

  } catch (error) {

    res.status(500).json({
      error: error.message
    })

  }

}


// LOGIN
exports.login = async (req, res) => {

  try {

    const { email, password, role } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      })
    }

    // check role
    if (user.role !== role) {
      return res.status(400).json({
        message: "Role mismatch"
      });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password"
      })
    }

    res.json({
      message: "Login successful",
      user
    })

  } catch (error) {

    res.status(500).json({
      error: error.message
    })

  }

}