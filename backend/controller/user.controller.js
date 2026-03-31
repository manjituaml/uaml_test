import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const createUser = async (req, res) => {
  try {
    const {
      userName,
      userId,
      userEmail,
      password,
      department,
      jobPosition,
      isStatus,
      isAdmin,
      isHead,
    } = req.body;

    console.log(userName);

    // 1️⃣ Basic validation
    if (!userName || !userId || !userEmail || !password) {
      return res
        .status(400)
        .json({ message: "Required fields missing", success: false });
    }

    // 2️⃣ Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ userId }, { userEmail }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "UserId or Email already exists", success: false });
    }

    // 3️⃣ Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 4️⃣ Create user with hashed password
    const user = await User.create({
      userName,
      userId,
      userEmail,
      password: hashedPassword,
      department,
      jobPosition,
      isStatus,
      isAdmin,
      isHead,
    });

    // 5️⃣ Send response (hide password)
    res.status(201).json({
      message: "User created successfully",
      success: true,
      user: {
        _id: user._id,
        userName: user.userName,
        userId: user.userId,
        userEmail: user.userEmail,
        department: user.department,
        jobPosition: user.jobPosition,
        isStatus: user.isStatus,
        isAdmin: user.isAdmin,
        isHead: user.isHead,
      },
    });
  } catch (error) {
    console.error("Create User Error:", error);
    res
      .status(500)
      .json({ message: "Failed to create user", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res
        .status(400)
        .json({ success: false, message: "User ID and Password required" });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // 🎟️ Create JWT
    const token = jwt.sign(
      {
        id: user._id,
        userId: user.userId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        userId: user.userId,
        userName: user.userName,
        userEmail: user.userEmail,
        isAdmin: user.isAdmin,
        isHead: user.isHead,
        isStatus: user.isStatus,
        department: user.department,
        jobPosition: user.jobPosition,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

export const getUserByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

export const editProfile = async (req, res) => {
  try {
    const { userId } = req.params; // This is the string userId like "rajeev", "mahesh"
    const {
      userName,
      userEmail,
      password,
      department,
      jobPosition,
      isStatus,
      isAdmin,
      isHead,
      statusPeriode,
    } = req.body;

    console.log("Editing user with userId:", userId);
    console.log("Update data:", req.body);

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Employee ID is required",
      });
    }

    // Check if user exists by userId field (not _id)
    const existingUser = await User.findOne({ userId: userId });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Validate department if provided
    if (
      department &&
      ![
        "production",
        "marketing",
        "purchase",
        "sales",
        "account",
        "hiring",
        "quality",
        "store",
      ].includes(department)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid department value",
      });
    }

    // Validate job position if provided
    if (
      jobPosition &&
      !["ceo", "manager", "junior", "senior"].includes(jobPosition)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid job position value",
      });
    }

    // Validate status if provided
    if (isStatus && !["active", "suspend", "deactive"].includes(isStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Check if email is already taken by another user
    if (userEmail && userEmail !== existingUser.userEmail) {
      const emailExists = await User.findOne({
        userEmail: userEmail.toLowerCase(),
        userId: { $ne: userId }, // Compare with userId field, not _id
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email is already in use by another employee",
        });
      }
    }

    // Prepare update object
    const updateData = {};

    if (userName) updateData.userName = userName;
    if (userEmail) updateData.userEmail = userEmail.toLowerCase();
    if (department) updateData.department = department;
    if (jobPosition) updateData.jobPosition = jobPosition;
    if (isStatus) updateData.isStatus = isStatus;
    if (typeof isAdmin !== "undefined") updateData.isAdmin = isAdmin;
    if (typeof isHead !== "undefined") updateData.isHead = isHead;

    // Handle status period for suspension
    if (isStatus === "suspend" && statusPeriode) {
      updateData.statusPeriode = new Date(statusPeriode);
    } else if (isStatus !== "suspend") {
      // Clear status period if not suspended
      updateData.statusPeriode = null;
    }

    // Handle password update
    if (password && password.trim() !== "") {
      // In production, use bcrypt:
      // const salt = await bcrypt.genSalt(10);
      // updateData.password = await bcrypt.hash(password, salt);
      updateData.password = password;
    }

    // Update the user using userId field
    const updatedUser = await User.findOneAndUpdate(
      { userId: userId }, // Find by userId field
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Failed to update employee",
      });
    }

    // Auto-reactivate if suspension period has passed
    if (updatedUser.isStatus === "suspend" && updatedUser.statusPeriode) {
      const now = new Date();
      if (now > updatedUser.statusPeriode) {
        updatedUser.isStatus = "active";
        updatedUser.statusPeriode = null;
        await updatedUser.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Employee profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error in editProfile:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate field value entered",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
