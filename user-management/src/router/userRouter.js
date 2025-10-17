import express from 'express'
// import {signup} from '../controller/signup.js'
import {invitedSignup,validateOtp,validateTOTP,otpsignup,totpsignup} from '../controller/invitedSignup.js'
const router = express.Router()
import {login,verification} from '../controller/login.js'

// router.post('/signup',signup)
// router.post('/login',signin)

router.patch('/invitedsignup',invitedSignup)
router.patch('/validateotpsignup',validateOtp,otpsignup)
router.patch('/validatetotpsignup',validateTOTP,totpsignup)
router.post('/login',verification)
router.post('/validateotplogin',validateOtp,login)
router.post('/validatetotplogin',validateTOTP,login)
export default router