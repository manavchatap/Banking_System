const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const accountController = require("../controllers/account.controller")

const router = express.Router()

// GET /accounts/ — get logged-in user's accounts (customer)
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController)

// GET /accounts/balance/:accountId — get balance for an account (customer)
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)

// POST /accounts/admin/:userId — system user creates a bank account for a customer
router.post("/admin/:userId", authMiddleware.authSystemUserMiddleware, accountController.adminCreateAccountController)

// PATCH /accounts/:accountId/status — system user: freeze / activate / close
router.patch("/:accountId/status", authMiddleware.authSystemUserMiddleware, accountController.updateAccountStatusController)

module.exports = router
