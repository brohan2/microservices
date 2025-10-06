import express from 'express'
// import {signup} from '../controller/signup.js'
import {invitedSignup,validateOtp} from '../controller/invitedSignup.js'
const router = express.Router()
import login from '../controller/login.js'

// router.post('/signup',signup)
// router.post('/login',signin)

router.patch('/invitedSignup',invitedSignup)
router.patch('/validateOtp',validateOtp)
router.post('/login',login)
export default router