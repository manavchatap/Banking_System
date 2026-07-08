const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const accountController = require("../controllers/account.controller")

const router = express.Router()

// create new account for a user 
// post /account/ 
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)

// get /accounts/
// get all accounts of logged-in users
router.get("/",authMiddleware.authMiddleware, accountController.getUserAccountsController)

// get /accounts/balance/:accountId
router.get("/balance/:accountId",authMiddleware.authMiddleware, accountController.getAccountBalanceController)


module.exports = router