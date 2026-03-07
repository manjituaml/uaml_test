import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./utils/db.js";
import userRoutes from "./route/user.route.js";
import orderRoutes from "./route/order.route.js";
import cookieParser from "cookie-parser";
import fetch from "node-fetch";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    // origin: ["https://uaml.onrender.com", "http://localhost:5173"], // React dev server
    origin: ["http://localhost:5173"], // React dev server
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.send("Server is healthy.");
});

// health route for ping
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.use("/uampi/users", userRoutes);
app.use("/uampi/orders", orderRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Something went wrong" });
});

// Start Server
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);

  // Self Ping every 5 minutes
  const SELF_URL = "https://uaml.onrender.com/health";

  setInterval(async () => {
    try {
      const res = await fetch(SELF_URL);
      console.log("Self ping:", res.status);
    } catch (error) {
      console.log("Self ping failed:", error.message);
    }
  }, 300000);
});
