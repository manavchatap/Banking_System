const accountModel = require ("../models/account.model")

async function createAccountController(req,res){

    const user = req.user

    const existing = await accountModel.findOne({ user: user._id })

    if (existing) {
        return res.status(409).json({
            message : "You already have a bank account"
        })
    }

    const account = await accountModel.create({
        user : user._id
    })

    res.status(201).json({
        account
    })
}

async function getUserAccountsController(req,res){

    const accounts = await accountModel.find({
        user : req.user._id
    })

    res.status(200).json({
        accounts
    })
}

async function getAccountBalanceController(req,res){

    const {accountId} = req.params;

    const account = await accountModel.findOne({
        _id : accountId,
        user : req.user._id
    })

    if(!account) {
        return res.status(404).json({
            message : "Account not found"
        })
    }

    const balance = await account.getBalance();

    res.status(200).json({
        accountId : account._id,
        balance : balance
    })
}

// SYSTEM USER — create a bank account for a specific customer
async function adminCreateAccountController(req, res) {
    const { userId } = req.params

    if (!userId) {
        return res.status(400).json({ message: "userId is required" })
    }

    const userModel = require("../models/user.model")
    const user = await userModel.findById(userId).select("+systemUser")

    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    if (user.systemUser) {
        return res.status(400).json({ message: "Cannot create a bank account for a system user" })
    }

    const existing = await accountModel.findOne({ user: userId })
    if (existing) {
        return res.status(409).json({ message: "This customer already has a bank account" })
    }

    const account = await accountModel.create({ user: userId })

    res.status(201).json({ account })
}

// SYSTEM USER — update account status (ACTIVE / FROZEN / CLOSED)
async function updateAccountStatusController(req, res) {
    const { accountId } = req.params
    const { status } = req.body

    if (!["ACTIVE", "FROZEN", "CLOSED"].includes(status)) {
        return res.status(400).json({
            message : "Status must be ACTIVE, FROZEN or CLOSED"
        })
    }

    const account = await accountModel.findByIdAndUpdate(
        accountId,
        { status },
        { new: true }
    ).populate("user", "name email")

    if (!account) {
        return res.status(404).json({
            message : "Account not found"
        })
    }

    res.status(200).json({ account })
}

module.exports = {
    createAccountController,
    adminCreateAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    updateAccountStatusController,
}
