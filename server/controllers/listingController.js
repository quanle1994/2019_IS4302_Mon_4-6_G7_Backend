import {deeds, golds} from "../models/fakeModels";

require('dotenv').load();

const getAllListings = async (req, res) => {
  let resdata = JSON.parse(JSON.stringify(Object.values(deeds).sort((a, b) => a.id > b.id ? 1 : -1)));
  resdata = resdata.filter(r => r.status !== 'INTERNAL');
  resdata = resdata.map(r => {
    r.purity = golds[r.goldId].purity;
    return r;
  });
  res.status(200).send(resdata);
};

module.exports = {
  getAllListings,
};
