const express = require ("express")
const {userRegisterController, userLoginController, userLogoutController} = require ("../controllers/auth.controller")

const router = express.Router()

// post auth/register
router.post("/register", userRegisterController)
// post auth/login
router.post("/login", userLoginController)
//post auth/logout
router.post("/logout", userLogoutController)

module.exports = router