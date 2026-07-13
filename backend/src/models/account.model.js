const mongoose = require("mongoose")
const ledgerModel = require("./ledger.model")

const accountSchema = new mongoose.Schema({

    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user",
        required : [true, "User is required for creating a account"],
        index : true
    },
    status : {
        type : String,
        enum : {
            values : ["ACTIVE","FROZEN","CLOSED"],
            message : "Status should be either ACTIVE, FROZEN or CLOSED"
        },
        default : "ACTIVE"
    },
    currency : {
        type : String,
        required : [true, "Currency is required for creating a account"],
        default : "INR",
    } //balance can be stored in ledger, so that we can keep track of all the transactions and their timestamps, and also we can keep track of the balance of the account at any point of time. This is called double entry accounting system. We can also keep track of the balance of the account at any point of time by keeping track of the transactions and their timestamps. This is called double entry accounting system.
//balance can never be stored in database, because if the balance is stored in database, then it can be easily manipulated by the user. So, we need to keep track of the transactions and their timestamps, and also we can keep track of the balance of the account at any point of time. This is called double entry accounting system.
},
{
    timestamps : true
})

accountSchema.index({user : 1, status : 1}) // compound index to ensure that a user can have only one active account at a time

accountSchema.methods.getBalance = async function() { // method to get the balance of the account by aggregating the ledger entries for this account

    const balanceData = await ledgerModel.aggregate([ 

        { $match : { account : this._id } }, // match all the ledger entries for this account

        { $group : {        // group by account and calculate the total debit and credit for this account
            _id : null,
            totalDebit : { $sum : { $cond : [ { $eq : ["$type", "DEBIT"] }, "$amount", 0 ] } },
            totalCredit : { $sum : { $cond : [ { $eq : ["$type", "CREDIT"] }, "$amount", 0 ] } }        
        } },

        { $project : {       // project the balance by subtracting total debit from total credit
            _id : 0,
            balance : { $subtract : ["$totalCredit", "$totalDebit"] }
        } }
     ])
     if (balanceData.length === 0) {   // if there are no ledger entries for this account, then the balance is 0
        return 0
     }
        return balanceData[0].balance
}

const accountModel = mongoose.model("account",accountSchema)

module.exports = accountModel

