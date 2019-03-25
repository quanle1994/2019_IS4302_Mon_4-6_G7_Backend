import {
  signUpUser,
  signInUser, getAllAssets,
} from '../controllers/userController';
import {
  verifyPassword, verifyToken,
} from '../middleware/authenticate'

import express from 'express';

const userRouter = express.Router();

userRouter.route('/signup')
  .post(signUpUser);

userRouter.route('/signin')
  .post(verifyPassword, signInUser);

userRouter.route('/getAllAssets')
  .get(verifyToken, getAllAssets);

module.exports = {
  userRouter
};