import express from 'express'
import signup from '../controller/signup.js'

const router = express.Router()

router.post('/signup',signup)
// router.post('/login',signin)

export default router