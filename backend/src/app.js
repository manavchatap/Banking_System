const express = require ("express") //create server instance / config server
const cookieParser = require ("cookie-parser")
const cors = require ("cors")
const authRoutes = require ("./routes/auth.routes")
const accountRoutes = require ("./routes/account.routes")
const transactionRoutes = require ("./routes/transaction.routes")

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.get("/",(req,res) => {
    res.send("Service is up and running")
})

// user routes
app.use("/auth", authRoutes)
app.use("/accounts", accountRoutes)
app.use("/transactions", transactionRoutes)


module.exports = app 