import express from "express";
import { getProfile, loginUser, logoutUser, registerUser, renewRefreshToken, verifyUser } from "../controllers/user.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify", verifyUser);
router.post("/refresh-token", renewRefreshToken);
router.get("/profile", auth, getProfile);
router.get("/logout", auth, logoutUser);

export default router;