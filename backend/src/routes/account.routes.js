const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const accountController = require("../controllers/account.controller")

const router = express.Router()

// POST /accounts/ — create account for logged-in user
router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)

// GET /accounts/ — get logged-in user's accounts
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController)

// GET /accounts/balance/:accountId — get balance for an account
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)

// PATCH /accounts/:accountId/status — system user: freeze / activate / close an account
router.patch("/:accountId/status", authMiddleware.authSystemUserMiddleware, accountController.updateAccountStatusController)

module.exports = router
