import {
  signUpUser,
  signInUser,
  getAllAssets,
  createDeedCaRequest,
  listDeedRequest,
  getAllMinersRequest,
  getAllCasRequest,
  postOfferRequest,
  getMyOffers,
  convertGoldToDeed,
  increaseCashRequest,
  minerCreateGoldRequest,
  registerUserRequest,
  updateUserRequest,
  updatePasswordRequest,
  getMinerWithGoldRequest,
  goldSaleRequest,
} from '../controllers/userController';
import {
  verifyDeed,
  verifyGold,
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

userRouter.route('/convertGoldToDeed')
  .post(verifyToken, convertGoldToDeed);

userRouter.route('/createDeedCa')
  .post(verifyToken, verifyGold, createDeedCaRequest);

userRouter.route('/listDeedForSale')
  .post(verifyToken, verifyDeed, listDeedRequest);

userRouter.route('/getAllMiners')
  .get(verifyToken, getAllMinersRequest);

userRouter.route('/getAllCas')
  .get(verifyToken, getAllCasRequest);

userRouter.route('/offerRequest')
  .post(verifyToken, verifyDeed, postOfferRequest);

userRouter.route('/getMyOffers')
  .get(verifyToken, getMyOffers);

userRouter.route('/getMyOffers/:userId')
  .get(verifyToken, getMyOffers);

userRouter.route('/increaseCash')
  .post(verifyToken, increaseCashRequest);

userRouter.route('/minerCreateGoldRequest')
  .post(verifyToken, minerCreateGoldRequest);

userRouter.route('/register')
  .post(registerUserRequest);

userRouter.route('/updateDetails')
  .post(verifyToken, updateUserRequest);

userRouter.route('/updatePassword')
  .post(verifyToken, updatePasswordRequest);

userRouter.route('/getMinerWithGold/:minerId')
  .get(verifyToken, getMinerWithGoldRequest);

userRouter.route('/buyGoldRequest')
  .post(verifyToken, goldSaleRequest);

module.exports = {
  userRouter
};