import express from 'express'
import {signup} from '../controller/authentication.js'

const router = express.Router()

router.post('/signup',signup)
// router.post('/login',signin)

export default router