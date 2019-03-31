import express from "express";
import {acceptOfferRequest, delistRequest, getAllListings} from "../controllers/listingController";
import {verifyDeed, verifyToken} from "../middleware/authenticate";

const listingRouter = express.Router();

listingRouter.route('/getAllListings')
  .get(getAllListings);

listingRouter.route('/acceptOffer')
  .post(verifyToken, verifyDeed, acceptOfferRequest);

listingRouter.route('/delist')
  .post(verifyToken, verifyDeed, delistRequest);

module.exports = {
  listingRouter
};
