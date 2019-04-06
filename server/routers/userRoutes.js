import {
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
  goldSaleRequest, getSaleRequest, getMyGoldRequests, minerSellsGold, increaseCashRequestCa,
} from '../controllers/userController';
import {
  verifyDeed,
  verifyGold,
  verifyPassword, verifyToken,
} from '../middleware/authenticate'

import express from 'express';

const userRouter = express.Router();

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

userRouter.route('/increaseCashCa')
  .post(verifyToken, increaseCashRequestCa);

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
  .post(verifyToken, verifyGold, goldSaleRequest);

userRouter.route('/getGoldRequest')
  .get(verifyToken, getSaleRequest);

userRouter.route('/getMinerGoldRequests')
  .get(verifyToken, getMyGoldRequests);

userRouter.route('/minerSellsGold')
  .post(verifyToken, verifyGold, minerSellsGold);

module.exports = {
  userRouter
};