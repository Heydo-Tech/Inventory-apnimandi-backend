const User = require("../Models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function login(name, password, establishmentId) {
  try {
    if (!name || !password) {
      return {
        success: false,
        message: "Missing required fields: name, password"
      };
    }
    const query = { name };
    if (establishmentId !== undefined) {
      query.establishmentId = Number(establishmentId);
    }
    const user = await User.findOne(query);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return { success: false, message: "Invalid password" };
    }
    const token = jwt.sign(
      {
        username: user.name,
        role: user.role,
        establishmentId: user.establishmentId
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    return {
      success: true,
      message: "Login successful",
      token,
      username: user.name,
      role: user.role,
      establishmentId: user.establishmentId
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Error logging in", error };
  }
}

async function create_user(name, password, role, establishmentId) {
  try {
    if (!name || !password || !role) {
      return {
        success: false,
        message: "Missing required fields: name, password, role"
      };
    }
    const query = { name };
    if (establishmentId !== undefined) {
      query.establishmentId = Number(establishmentId);
    }
    const existingUser = await User.findOne(query);
    if (existingUser) {
      return { success: false, message: "User already exists" };
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      password: hashedPassword,
      role,
      establishmentId:
        establishmentId !== undefined ? Number(establishmentId) : null
    });
    await user.save();
    return { success: true, message: "User created successfully" };
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, message: "Error creating user", error };
  }
}

module.exports = { login, create_user };
