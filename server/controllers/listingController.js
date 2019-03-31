import {acceptOffer, api, delist, getAllDeeds, getAllTransactions} from "../composer/api";
import {getDetailsOfDeed} from "./userController";

const uuid4 = require("uuid4");

require('dotenv').load();

const getAllListings = async (req, res) => {
  let resdata = await getAllDeeds();
  resdata = resdata.data.filter(r => r.listingState !== 'NOT_LISTED');

  resdata = resdata.map(async r => await getDetailsOfDeed(r));
  Promise.all(resdata).then(c => {
    const allDeeds = c.map(c => {
      delete c.offers;
      return c;
    });
    res.status(200).send(allDeeds);
  }).catch(e => {
    console.log(e);
    return res.status(500).send({message: 'Internal Server Error'})
  });
};

const getDeedTransactions = async (req, res) => {
  try {
    const { deed } = req.deed;
    let resData = await getAllTransactions();

  } catch (e) {
    return res.status(500).send({message: 'Internal Server Error'});
  }
};

const acceptOfferRequest = async (req, res) => {
  try {
    const { user, body, deed } = req;
    const { tx } = body;
    if (deed.currentOwner.userId !== user.username) {
      return res.status(401).send({message: 'You do not own this deed'});
    }
    await acceptOffer({
      deedToBuy: deed.deedId,
      offerTxId: tx,
      newDeedId: uuid4(),
    });
    return res.status(200).send({message: 'SUCCESS'});
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Cannot Accept Offer'});
  }
};

const delistRequest = async (req, res) => {
  try {
    const { user, deed } = req;
    if (deed.currentOwner.userId !== user.username) {
      return res.status(401).send({message: 'You do not own this deed'});
    }
    await delist({
      deed: deed.deedId,
    });
    return res.status(200).send({message: 'SUCCESS'});
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Cannot Delist Deed'});
  }
};

module.exports = {
  getAllListings,
  acceptOfferRequest,
  delistRequest,
};
