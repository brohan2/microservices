import express from 'express'
import {auth} from '../authentication/jwt.js'

const irouter = express.Router()

irouter.post('/',logging,auth,inviteValidatePayload,inviteValidateAuthorization,invite)