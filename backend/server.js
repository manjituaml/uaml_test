import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./utils/db.js";
import userRoutes from "./route/user.route.js";
import orderRoutes from "./route/order.route.js";
import cookieParser from "cookie-parser";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: "https://uaml.onrender.com", // React dev server
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser()); 

// Routes
app.get("/", (req, res) => {
  res.send("Server is healthy.");
});

app.use("/uampi/users", userRoutes);
app.use("/uampi/orders", orderRoutes)

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({ message: "Something went wrong" });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
