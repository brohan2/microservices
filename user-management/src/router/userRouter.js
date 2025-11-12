import express from 'express'
// import {signup} from '../controller/signup.js'
import {invitedSignup,validateOtp,validateTOTP,otpsignup,totpsignup} from '../controller/invitedSignup.js'
const router = express.Router()
import {login,verification} from '../controller/login.js'
import { refreshToken } from '../controller/refresh.js'
import { auth } from '../authentication/jwt.js'
import { forgotInitiate, forgotVerifyOtp, forgotVerifyTotp, passwordReset, passwordUpdate } from '../controller/password.js'
import { deleteUser } from '../controller/userManage.js'
import rateLimit from 'express-rate-limit'

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
})

// this will signup the invited users
router.patch('/invitedsignup',invitedSignup)

// this will validate users via otp and signup
router.patch('/validateotpsignup',validateOtp,otpsignup)


// this will validate users via totp and signup
router.patch('/validatetotpsignup',validateTOTP,totpsignup)

// this will verify authentication of user
router.post('/login',verification)

// this will validate user using otp
router.post('/validateotplogin',validateOtp,login)

// this will validate user using totp
router.post('/validatetotplogin',validateTOTP,login)

// exchange refresh token for new access token
router.post('/refresh', refreshToken)

// forgot password flows
router.post('/forgot', forgotLimiter, forgotInitiate)
router.post('/forgot/verify-otp', forgotLimiter, forgotVerifyOtp)
router.post('/forgot/verify-totp', forgotLimiter, forgotVerifyTotp)
router.post('/password/reset', forgotLimiter, passwordReset)

// update password (authenticated)
router.patch('/password', auth, passwordUpdate)

// delete user (authorized)
router.delete('/:id', auth, deleteUser)

// router.get('/profile')
// router.patch('/forgotpassword')
// router.patch('/changeMFA')
export default router