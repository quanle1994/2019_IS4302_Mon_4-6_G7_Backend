import {
  signUpUser,
  signInUser,
  getAllAssets,
  createGoldRequest,
  createDeedCaRequest,
  createDeedRequest,
  listDeedRequest,
  getAllMinersRequest, getAllCasRequest, postOfferRequest, getMyOffers,
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

userRouter.route('/createGold')
  .post(verifyToken, createGoldRequest);

userRouter.route('/createDeedCa')
  .post(verifyToken, verifyGold, createDeedCaRequest);

userRouter.route('/createDeed')
  .post(verifyToken, verifyGold, createDeedRequest);

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

module.exports = {
  userRouter
};