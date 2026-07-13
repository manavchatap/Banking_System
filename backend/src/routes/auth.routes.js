const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const {
    userRegisterController,
    userLoginController,
    userLogoutController,
    getAllUsersController,
    forgotPasswordController,
    verifyOtpController,
    resetPasswordController,
} = require("../controllers/auth.controller")

const router = express.Router()

// POST /auth/login — public
router.post("/login", userLoginController)

// POST /auth/logout — public (reads cookie)
router.post("/logout", userLogoutController)

// POST /auth/register — system user only
router.post("/register", authMiddleware.authSystemUserMiddleware, userRegisterController)

// GET /auth/users — system user only: list all customers
router.get("/users", authMiddleware.authSystemUserMiddleware, getAllUsersController)

// POST /auth/forgot-password — public: send OTP to email
router.post("/forgot-password", forgotPasswordController)

// POST /auth/verify-otp — public: verify OTP, get reset token
router.post("/verify-otp", verifyOtpController)

// POST /auth/reset-password — public: set new password
router.post("/reset-password", resetPasswordController)

module.exports = router
