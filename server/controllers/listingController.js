import {deeds, golds} from "../models/fakeModels";
import {api, getAllDeeds, getAllTransactions} from "../composer/api";
import {getDetailsOfDeed} from "./userController";

require('dotenv').load();

const getAllListings = async (req, res) => {
  let resdata = await getAllDeeds();
  resdata = resdata.data.filter(r => r.status !== 'NOT_LISTED');

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
    return res.status(500).send({message: 'Internal Server Error'})
  }
};

module.exports = {
  getAllListings,
};
