import express from 'express'
// import {signup} from '../controller/signup.js'
import {invitedSignup,validateOtp,validateTOTP,otpsignup,totpsignup} from '../controller/invitedSignup.js'
const router = express.Router()
import {login,verification} from '../controller/login.js'

// router.post('/signup',signup)
// router.post('/login',signin)


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
export default router