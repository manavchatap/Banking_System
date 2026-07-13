const {Router} = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router()

// POST /transactions/ — regular user transfer
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

// POST /transactions/system/initial-funds — system user seeds funds
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

// GET /transactions/system/all — system user: all initial-funds transactions
transactionRoutes.get("/system/all", authMiddleware.authSystemUserMiddleware, transactionController.getAllInitialFundsTransactions)

// GET /transactions/system/accounts — system user: all accounts across all users
transactionRoutes.get("/system/accounts", authMiddleware.authSystemUserMiddleware, transactionController.getAllAccountsForAdmin)

module.exports = transactionRoutes;  