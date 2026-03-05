import express from "express";
import { createUser, editProfile, getAllUsers, getUserByUserId, login, logout } from "../controller/user.controller.js";
import { isAuthentication } from "../middleware/isAuthentication.js";

const router = express.Router();

router.post('/login', login);
router.post("/create", isAuthentication, createUser);
router.post('/logout',isAuthentication, logout);
router.get("/getallusers", isAuthentication, getAllUsers);
router.get("/getuser/:userId",isAuthentication, getUserByUserId);
router.put("/edit/:userId",isAuthentication, editProfile);

export default router;
 