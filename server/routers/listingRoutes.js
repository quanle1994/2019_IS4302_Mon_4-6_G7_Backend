import express from "express";
import {getAllListings} from "../controllers/listingController";

const listingRouter = express.Router();

listingRouter.route('/getAllListings')
  .get(getAllListings);

module.exports = {
  listingRouter
};
