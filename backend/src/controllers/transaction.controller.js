const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const mongoose = require("mongoose")
// create new transaction for a user, 10 steps transfer flow :

// 1. validate the request body
// 2. validate idempotency key
// 3. check account status
// 4. derive sender account balance from ledger (if balance is less than amount, throw error)
// 5. create a new transaction with status PENDING
// 6. create a debit ledger entry for the sender account
// 7. create a credit ledger entry for the receiver account
// 8. update the transaction status to COMPLETED
// 9. commit mongodb session
// 10. send email notification to both sender and receiver



async function createTransaction (req,res) {
    // 1.validate the request body
    const {toAccount, amount, idempotencyKey} = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message : "All fields are required",
            status : "Failed"
        })
    }

    // Get fromAccount from authenticated user
    const fromUserAccount = await accountModel.findOne({ user: req.user._id })

    if (!fromUserAccount) {
        return res.status(404).json({
            message : "Invalid fromAccount - User does not have an account",
            status : "Failed",
            userId: req.user._id
        })
    }

    const toUserAccount = await accountModel.findOne({ _id : toAccount })

    if (!toUserAccount) {
        return res.status(404).json({
            message : "One or both accounts not found",
            status : "Failed"
        })
    }

    // 2.validate idempotency key
    const existingTransaction = await transactionModel.findOne({ idempotencyKey })

    if(existingTransaction) {
        return res.status(200).json({
            message : "Transaction already processed",
            status : existingTransaction.status,
            data : existingTransaction
        })
    }

        // 3. check account status
        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message : "Both fromAccount or toAccount must be active for transaction to be processed"
            })
        }

        // 4. derive sender account balance from ledger (if balance is less than amount, throw error) 
        const balance = await fromUserAccount.getBalance()

        if (balance < amount) {
            return res.status(400).json({
                message : "Insufficient balance in fromAccount",
                status : "Failed"
            })
        }

        // 5. create a new transaction with status PENDING
        let transaction; //because the server throwing " Transaction is pending due to some issue, please retry after some time."
        try {

        const session = await mongoose.startSession()
        session.startTransaction()  // start a new mongodb session for transaction all-or-nothing operation

         transaction = await transactionModel.create([{
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session })

        const createdTransaction = transaction[0]

        // 6. create a debit ledger entry for the sender account
        await ledgerModel.create([{
            account : fromUserAccount._id,
            amount,
            transaction : createdTransaction._id,
            type : "DEBIT"
        }], { session })

        // 7. create a credit ledger entry for the receiver account
        await ledgerModel.create([{
            account : toAccount,
            amount,
            transaction : createdTransaction._id,
            type : "CREDIT"
        }], { session })

        // 8. update transaction status to COMPLETED
        await transactionModel.updateOne(
            { _id: createdTransaction._id },
            { $set: { status: "COMPLETED" } },
            { session }
        )

        const completedTransaction = await transactionModel.findById(createdTransaction._id).session(session)

        // 9. commit mongodb session
        await session.commitTransaction() // commit the transaction if all operations are successful
        session.endSession() // end the session

        res.status(201).json({
            message : "Transaction completed successfully",
            status : "Success",
            data : completedTransaction
        })  

    }catch(error){
        await session.abortTransaction()
        session.endSession()
        res.status(400).json({
            message : "Transaction is pending due to some issue, please retry after some time."
        })
    }

        // 10.send email notification to both sender and receiver (this can be done using a message queue like RabbitMQ or Kafka, but for simplicity, we will just log the email notification here)
        console.log(`Email notification sent to ${fromUserAccount.user} for debit of ${amount} from account ${fromUserAccount._id}`)
        console.log(`Email notification sent to ${toUserAccount.user} for credit of ${amount} to account ${toAccount}`)

}

async function createInitialFundsTransaction (req,res) {

    const {toAccount, amount, idempotencyKey} = req.body

    if(!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message : "toAccount,amount,idempotencyKey are required"
        })
    }

    // Verify that the authenticated user is a system user
    if (!req.user.systemUser) {
        return res.status(403).json({
            message : "Only system users can create initial transactions",
            status : "Failed"
        })
    }

    const toUserAccount = await accountModel.findOne({ 
        _id: toAccount
    })

    if(!toUserAccount) {
        return res.status(400).json({
            message : "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user : req.user._id
    })
  
    if (!fromUserAccount) {
        return res.status(400).json({
            message : "Invalid fromAccount - System user does not have an account"
        })
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount : fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status : "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create ([{
        account : fromUserAccount._id,
        amount : amount,
        transaction : transaction._id,
        type : "DEBIT"
    }],{ session }) // session data should be in array format

    const creditLedgerEntry = await ledgerModel.create ([{
        account : toUserAccount._id,
        amount : amount,
        transaction : transaction._id,
        type : "CREDIT"
    }],{ session })

    transaction.status = "COMPLETED"
    await transaction.save ({ session })

    await session.commitTransaction()
        session.endSession()

    return res.status(201).json({
        message : "Initial funds transaction completed successfully",
        transaction : transaction
    })

}

// SYSTEM USER — get all initial-funds transactions (from system account)
async function getAllInitialFundsTransactions(req, res) {
    const systemAccount = await accountModel.findOne({ user: req.user._id })

    if (!systemAccount) {
        return res.status(404).json({ message: "System account not found" })
    }

    const transactions = await transactionModel
        .find({ fromAccount: systemAccount._id })
        .populate({
            path: 'toAccount',
            populate: { path: 'user', select: 'name email' }
        })
        .sort({ createdAt: -1 })

    res.status(200).json({ transactions })
}

// SYSTEM USER — get all accounts across all users
async function getAllAccountsForAdmin(req, res) {
    const { status } = req.query

    const filter = {}
    if (status && ["ACTIVE","FROZEN","CLOSED"].includes(status)) {
        filter.status = status
    }

    const accounts = await accountModel
        .find(filter)
        .populate('user', 'name email createdAt')
        .sort({ createdAt: -1 })

    const accountsWithBalance = await Promise.all(
        accounts.map(async (acc) => {
            const balance = await acc.getBalance()
            return { ...acc.toObject(), balance }
        })
    )

    res.status(200).json({ accounts: accountsWithBalance })
}

module.exports = { createTransaction, createInitialFundsTransaction, getAllInitialFundsTransactions, getAllAccountsForAdmin }