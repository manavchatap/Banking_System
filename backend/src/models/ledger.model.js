const mongoose = require("mongoose")

const ledgerSchema = new mongoose.Schema({

    account :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "account",
        required : [true, "Account is required for creating a ledger"],
        index : true,
        immutable : true
    },
    amount : {
        type : Number,
        required : [true, "Amount is required for creating a ledger"],
        min : [0, "Amount should be greater than or equal to 0"],
        immutable : true
    },
    transaction : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "transaction",
        required : [true, "Transaction is required for creating a ledger"],
        index : true,
        immutable : true
    },
    type : {
        type : String,
        enum : {
            values : ["CREDIT","DEBIT"],
            message : "Type should be either CREDIT or DEBIT"
        },
        required : [true, "Type is required for creating a ledger"],
        immutable : true
    }
})

function preventLedgerModification () {
    throw new Error("Ledger cannot be modified")
}

ledgerSchema.pre("updateOne", preventLedgerModification)
ledgerSchema.pre("deleteOne", preventLedgerModification)
ledgerSchema.pre("findOneAndUpdate", preventLedgerModification)
ledgerSchema.pre("findOneAndDelete", preventLedgerModification)
ledgerSchema.pre("deleteMany", preventLedgerModification)
ledgerSchema.pre("updateMany", preventLedgerModification)
ledgerSchema.pre("remove", preventLedgerModification)
ledgerSchema.pre("findOneAndRemove", preventLedgerModification)
ledgerSchema.pre("findOneAndReplace", preventLedgerModification)

const ledgerModel = mongoose.model("ledger",ledgerSchema)

module.exports = ledgerModel


