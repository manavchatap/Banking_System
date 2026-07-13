const mongoose = require ("mongoose")

function connectDB () {
    mongoose.connect(process.env.MONGO_URI) // by require("dotenv").config()
    .then (() => {
        console.log("Connected to DB")
    }).catch (err =>{
        console.log("Error connecting to DB")
        process.exit(1);    // stops server
    })
}


module.exports = connectDB