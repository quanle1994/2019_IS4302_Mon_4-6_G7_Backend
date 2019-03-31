import * as jwt from "jsonwebtoken";
import {
  api,
  createDeedCa,
  createGold,
  getAllCas,
  getAllDeedGolds,
  getAllMiners,
  getAllOffers,
  getCaById,
  getDeedById,
  getGoldById,
  listDeed,
  offer
} from '../composer/api';

const uuid4 = require('uuid4');

require('dotenv').load();

const signUpUser = async (req, res) => {
  const {name, email, password, phone} = req.body;
  const user = {name, email, password, phone};

  try {
    res.status(200).send(user);
  } catch (e) {
    res.status(400).send(e)
  }
};

const signInUser = async (req, res) => {
  const token = await generateAuthToken(req.user);
  res.header('x-auth', token).status(200).send(req.user);
};

const getAllAssets = async (req, res) => {
  const { username, type } = req.user;
  try {
    let user = undefined;
    await api.get(`/org.acme.goldchain.${type}/${username}`).then(res => user = res.data);
    if (user === undefined) return res.status(404).send({message: 'User Not Found'});

    const deeds = user.deedOwned === undefined ? [] : user.deedOwned.map(async id => {
      const res = await getDeedById(id.split('#')[1]).catch(e => console.log(e.response.data.error));
      const d = res.data;
      const deed = await getDetailsOfDeed(d);
      if (deed === undefined)
        throw Error('Cannot get deed details');
      else {
        return deed;
      }
    });

    const golds = user.goldOwned === undefined ? [] : user.goldOwned.map(async id => {
      const gold = await getDetailsOfGold(id.split('#')[1]);
      if (gold === undefined)
        throw Error('Cannot get gold details');
      else
        return gold;
    });

    Promise.all(deeds).then(d => {
      Promise.all(golds).then(g => {
        delete d.action;
        delete g.convert;
        const goldOwned = g.map(async gold => {
          const go = await getAllDeedGolds(gold.goldId).catch(e => {
            console.log('ERROR HERE');
            console.log(e);
            return undefined;
          });
          const weightListed = go.data.reduce((a, b) => a + b.goldWeight, 0);
          gold.deeds = [...go.data];
          gold.weightListed = weightListed;
          return gold;
        });
        Promise.all(goldOwned).then(go => res.status(200).send({
          deedOwned: d,
          goldOwned: go,
          money: user.cash,
        }));
      });
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({message: 'Internal Server Error'});
  }
};

const getDetailsOfDeed = async (deed) => {
  deed.listingState = deed.listingState === 'FOR_1TO1_SALE' ? 'FOR_SALE' : deed.listingState;
  const gold = await getDetailsOfGold(deed.gold.split('#')[1]);
  if (gold === undefined) return undefined;
  deed.purity = gold.goldPurity;
  deed.gold = gold;
  deed = await getCurrentOwner(deed);
  return deed;
};

const getCurrentOwner = async (deed) => {
  const { currentOwner } = deed;
  const parts = currentOwner.split('#');
  const res = await api.get(`/${parts[0].split('resource:')[1]}/${parts[1]}`).catch(e => {
    console.log(e);
    return undefined;
  });
  deed.currentOwner = res.data;
  delete deed.currentOwner.password;
  delete deed.currentOwner.deedOwned;
  delete deed.currentOwner.goldOwned;
  return deed;
};

const getDetailsOfCa = async (id) => {
  const res = await getCaById(id).catch(e => {
    console.log(e.response.data.error);
    return undefined;
  });
  let ca = res.data;
  delete ca.password;
  delete ca.deedOwned;
  delete ca.goldOwned;
  return ca;
};

const getDetailsOfGold = async (id) => {
  const res = await getGoldById(id).catch(e => {
    console.log(e.response.data.error);
    return undefined;
  });
  const gold = res.data;
  const ca = await getDetailsOfCa(gold.verifiedBy.split('#')[1]);
  if (ca === undefined) return undefined;
  gold.verifiedBy = ca;
  gold.ca = ca.name;
  return gold;
};

const createDeedCaRequest = async (req, res) => {
  const {user, gold, body} = req;
  const { type } = user;
  console.log(user);
  if (user === undefined || type !== 'CertificateAuthority') {
    return res.status(401).send({message: 'User is not a CA'});
  }
  const { weight, caId, title, price } = body;
  const data = {
    "$class": "org.acme.goldchain.CreateDeedCa",
    "deedId": uuid4(),
    "goldWeight": weight,
    "listingState": "NOT_LISTED",
    "user": caId,
    // title,
    // price,
    "gold": gold.goldId,
  };
  try {
    await createDeedCa(data);
    return res.status(200).send({message: 'Success'});
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Internal Server Error'});
  }
};

const createDeedRequest = async (req, res) => {
  const {user, gold, body} = req;
  const { type } = user;
  if (user === undefined || type !== 'RegisteredUser') {
    return res.status(401).send({message: 'User is not a RegisteredUser'});
  }
  const { deedId, weight, userId, title, price, description, state } = body;
  const data = {
    "$class": "org.acme.goldchain.CreateDeedCa",
    "deedId": deedId,
    "goldWeight": weight,
    "listingState": state === undefined || state === 0 ? "NOT_LISTED" : state === 1 ? "FOR_1TO1_SALE" : "AUCTION",
    "user": userId,
    "gold": gold.goldId,
    "title": title,
    "price": price,
    "description": description,
  };
  try {
    await createDeedCa(data);
    return res.status(200).send({message: 'Success'});
  } catch (e) {
    console.log(e);
    return res.status(500).send({message: 'Internal Server Error'});
  }
};

const listDeedRequest = async (req, res) => {
  const {body} = req;
  const { title, price, description, deedId, weightToList } = body;
  const data = {
    "$class": "org.acme.goldchain.ListDeedForSale",
    deedId: deedId,
    title,
    price,
    description,
    weightToList,
  };
  try {
    await listDeed(data);
    return res.status(200).send({message: 'Success'});
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to list deed'});
  }
};

const postOfferRequest = async (req, res) => {
  try {
    const { user, deed, body } = req;
    const { offerPrice } = body;
    await offer({
      offerPrice,
      deedToBuy: deed.deedId,
      buyerId: user.username,
    });
    return res.status(200).send({message: 'Post successfully'});
  } catch (e) {
    if (e.response !== undefined && e.response.data !== undefined && e.response.data.error !== undefined
      && e.response.data.error.message.toLowerCase().indexOf('insufficient funds') >= 0) {
      return res.status(500).send({message: 'Insufficient fund to purchase'});
    }
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to post offer'});
  }
};

const getMyOffers = async (req, res) => {
  try {
    const { user } = req;
    const r = await getAllOffers();
    const myOffers = r.data.filter(r => r.buyerId.endsWith(`#${user.username}`));
    const p = myOffers.map(async o => {
      try {
        const r2 = await getDeedById(o.deedToBuy.split('#')[1]);
        o.deedToBuy = await getDetailsOfDeed(r2.data);
        return o;
      } catch (e) {
        console.log(e);
        return undefined;
      }
    });
    return await Promise.all(p).then(offers => res.status(200).send(offers));
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to fetch offers'});
  }
};

const createGoldRequest = async (req, res) => {
  const { weight, ca, purity, minerId, user } = req.body;
  const data = {
    "$class": "org.acme.goldchain.CreateGold",
    "goldId": uuid4(),
    "goldWeight": weight,
    "goldPurity": purity,
    "caId": ca,
    "user": user,
    "minerId": minerId,
  };
  try {
    await createGold(data);
    return res.status(200).send({message: 'Success'});
  } catch (e) {
    console.log(e);
    return res.status(500).send({message: 'Failed to create gold'});
  }
};

const getAllMinersRequest = async (req, res) => {
  try {
    const r = await getAllMiners();
    return res.status(200).send(r.data.map(m => {
      delete m.password;
      return m;
    }));
  } catch (e) {
    console.log(e);
    return res.status(500).send({message: 'Failed to get miners'});
  }
};

const getAllCasRequest = async (req, res) => {
  try {
    const r = await getAllCas();
    return res.status(200).send(r.data.map(m => {
      delete m.password;
      return m;
    }));
  } catch (e) {
    console.log(e);
    return res.status(500).send({message: 'Failed to get miners'});
  }
};

const generateAuthToken = async function (user) {
  const access = user.type;
  // const uid = user.id;
  const uid = user.username;

  return jwt.sign({access, uid}, process.env.NODE_SECRET);
};

module.exports = {
  signUpUser,
  signInUser,
  getAllAssets,
  getDetailsOfDeed,
  getDetailsOfGold,
  createGoldRequest,
  createDeedCaRequest,
  createDeedRequest,
  listDeedRequest,
  getAllMinersRequest,
  getAllCasRequest,
  postOfferRequest,
  getMyOffers,
};