const express = require ("express") //create server instance / config server
const cookieParser = require ("cookie-parser")
const cors = require ("cors")
const authRoutes = require ("./routes/auth.routes")
const accountRoutes = require ("./routes/account.routes")
const transactionRoutes = require ("./routes/transaction.routes")
const chatRoutes = require ("./routes/chat.routes")

const app = express();

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true)

        const allowed = [
            process.env.FRONTEND_URL,
            "http://localhost:5173",
        ].filter(Boolean)

        // Allow any Vercel preview deployment for this project
        const isVercelPreview = origin.match(/https:\/\/banking-system.*\.vercel\.app$/)

        // Allow any localhost port for local development
        const isLocalhost = origin.match(/^http:\/\/localhost:\d+$/)

        if (allowed.includes(origin) || isVercelPreview || isLocalhost) {
            callback(null, true)
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`))
        }
    },
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

// Manu AI — POST /chat and DELETE /session
// Vite proxy strips /api prefix so /api/chat → /chat on this server
app.use("/", chatRoutes)


module.exports = app 