import express from 'express'
// import {signup} from '../controller/signup.js'
import superAdminLogin from '../controller/invitedSignup.js'
const router = express.Router()

// router.post('/signup',signup)
// router.post('/login',signin)
router.post('/signup',superAdminLogin)
export default router