import express from 'express'
import {auth} from '../authentication/jwt.js'
import inviteValidatePayload from '../middleware/inviteValidatePayload.js'
import inviteValidateAuthorization from '../middleware/inviteValidateAuthorization.js'
import invite from '../controller/invite.js'
import showinvites from '../controller/showinvites.js'
// import revokeinvite from '../controller/revoke.js'
const irouter = express.Router()

// the router have multiple middlewares
/*
    auth - to verify JWT token and fetch the current user information from database and pass it on
    inviteValidationPayload - it will validate the payload using zod validation
    inviteValidationAuthorization - it will verify if the current user is authorized to send the invite
    invite - the actual logic where we save the pre details in database and request notification service
*/
irouter.post('/invite',auth,inviteValidatePayload,inviteValidateAuthorization,invite)

/* This will show the invitelist and status*/
irouter.get('/inviteelist',auth,showinvites)

// irouter.post('/revokeinvite',auth,revokeAuthorization,revokeinvite)
// irouter.post('/deleteinvite')
export default irouter