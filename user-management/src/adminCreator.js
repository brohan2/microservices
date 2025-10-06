import User from './schema/userSchema.js'
import bcrypt from 'bcrypt'
import connectdb from './db/db-connection.js'


connectdb()


adminCreator()