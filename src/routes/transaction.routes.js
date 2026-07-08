const {Router} = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router()

// create new transaction for a user
// /transactions/
// PROTECTED ROUTE
transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

//post /transaction/system/initial-funds
// create initial funds for system user
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)


module.exports = transactionRoutes;