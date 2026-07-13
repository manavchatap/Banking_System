const userModel = require ("../models/user.model")
const jwt = require ("jsonwebtoken")
const crypto = require ("crypto")
const transporter = require ("../config/mail")
const tokenBlacklistModel = require ("../models/blackList.model")
const redis = require ("../config/redis")


// SYSTEM USER — register a new customer
async function userRegisterController (req,res) {
 

    const {email, password, name} = req.body

    if (!email || !password || !name) {
        return res.status(400).json({
            message : "name, email and password are required"
        })
    }

    const isExist = await userModel.findOne({ email })
    if(isExist) {
        return res.status(422).json({
            message : "User already exists with this email",
            status : "Failed"
        })
    }

    const user = await userModel.create({ email, password, name })

    try {
        await transporter.sendMail({
            from : process.env.EMAIL_USER,
            to : email,
            subject : "Welcome to NexaBank",
            text : `Hi ${name}, your NexaBank account has been created. You can now log in at the banking portal.`
        })
    } catch (mailErr) {
        console.error("Welcome email failed:", mailErr.message)
    }

    res.status(201).json({
        _id   : user._id,
        email : user.email,
        name  : user.name
    })
}

// SYSTEM USER — list all registered customers (excluding system users)
async function getAllUsersController (req, res) {
    const users = await userModel
        .find({})
        .select("name email createdAt")
        .sort({ createdAt: -1 })

    res.status(200).json({ users })
}

async function userLoginController (req,res) {

    const {email,password} = req.body

    const user = await userModel.findOne({email}).select("+password")

    if(!user){  
        return res.status(404).json({
            message : "Email is invalid"
        })
    }

    const isPasswordValid = await user.comparePassword(password)

    if(!isPasswordValid){
        return res.status(404).json({
            message : "Password is invalid"
        })
    }

    const token = jwt.sign({userId : user._id}, process.env.JWT_SECRET, {expiresIn : "3d"})

    res.cookie("token", token, {
        httpOnly : true,
        sameSite : "lax",
        maxAge   : 3 * 24 * 60 * 60 * 1000  // 3 days in ms
    })

    res.status(200).json({
        _id   : user._id,
        email : user.email,
        name  : user.name
    })
}

async function userLogoutController (req,res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

    if(!token){
        return res.status(200).json({
            message : "User logged out successfully"
        })
    }

    await tokenBlacklistModel.create({ token })

    res.clearCookie("token")

    res.status(200).json({
        message : "User logged out successfully"
    })
}


// FORGOT PASSWORD — Step 1: send OTP to email
async function forgotPasswordController(req, res) {
    const { email } = req.body

    if (!email) {
        return res.status(400).json({ message: "Email is required" })
    }

    const user = await userModel.findOne({ email })
    if (!user) {
        // Return success anyway to prevent email enumeration
        return res.status(200).json({ message: "If that email exists, an OTP has been sent" })
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString()

    // Store in Redis with 5-minute TTL
    await redis.set(`otp:${email}`, otp, { ex: 300 })

    try {
        await transporter.sendMail({
            from    : process.env.EMAIL_USER,
            to      : email,
            subject : "NexaBank — Password Reset OTP",
            text    : `Your OTP for password reset is: ${otp}\n\nThis OTP expires in 5 minutes.\n\nIf you did not request this, please ignore this email.`
        })
    } catch (mailErr) {
        console.error("OTP email failed:", mailErr.message)
        return res.status(500).json({ message: "Failed to send OTP email" })
    }

    res.status(200).json({ message: "OTP sent to your email" })
}

// FORGOT PASSWORD — Step 2: verify OTP
async function verifyOtpController(req, res) {
    const { email, otp } = req.body

    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" })
    }

    const stored = await redis.get(`otp:${email}`)

    if (!stored) {
        return res.status(400).json({ message: "OTP has expired. Please request a new one." })
    }

    if (stored.toString() !== otp.toString()) {
        return res.status(400).json({ message: "Invalid OTP" })
    }

    // Delete OTP — one-time use
    await redis.del(`otp:${email}`)

    // Generate a random reset token and store in Redis with 10-min TTL
    // This is safer than a JWT — it lives only in Redis and is deleted on use
    const resetToken = crypto.randomBytes(32).toString("hex")
    await redis.set(`reset:${resetToken}`, email, { ex: 600 }) // 10 minutes

    res.status(200).json({ message: "OTP verified", resetToken })
}

// FORGOT PASSWORD — Step 3: reset password
async function resetPasswordController(req, res) {
    const { resetToken, newPassword } = req.body

    if (!resetToken || !newPassword) {
        return res.status(400).json({ message: "Reset token and new password are required" })
    }

     if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" })
    }

    // Fetch email from Redis — if key doesn't exist, token expired or already used
    const email = await redis.get(`reset:${resetToken}`)

    if (!email) {
        return res.status(400).json({ message: "Reset token is invalid, expired or already used" })
    }

    const user = await userModel.findOne({ email })
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }

    user.password = newPassword
    await user.save()

    // Delete token immediately — single use, gone after this
    await redis.del(`reset:${resetToken}`)

    res.status(200).json({ message: "Password reset successfully. You can now log in." })
}

module.exports = {userRegisterController, userLoginController, userLogoutController, getAllUsersController, forgotPasswordController, verifyOtpController, resetPasswordController}
 