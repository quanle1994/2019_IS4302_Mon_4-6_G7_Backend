import * as jwt from "jsonwebtoken";
import {
  api,
  createDeed, createDeedCa, createDeedOffer,
  createGold,
  getAllCas,
  getAllDeedGolds,
  getAllMiners,
  getAllOffers,
  getCaById,
  getDeedById, getDeedOfferById,
  getGoldById, getMinerById, getUserById, increaseCash,
  listDeed, minerCreateGold,
  offer,
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

const getDetailsOfMiner = async (id) => {
  const res = await getMinerById(id).catch(e => {
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
  if (gold.verifiedBy !== undefined) {
    const ca = await getDetailsOfCa(gold.verifiedBy.split('#')[1]);
    if (ca === undefined) return undefined;
    gold.verifiedBy = ca;
    gold.ca = ca.name;
  }
  if (gold.miner !== undefined) {
    gold.minerInfo = await getDetailsOfMiner(gold.miner.split('#')[1]);
  }
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
    const offerId = uuid4();
    await createDeedOffer({
      offerId,
      goldWeight: deed.goldWeight,
      offerPrice,
      purity: deed.gold.goldPurity,
      title: deed.title,
      description: deed.description,
      owner: deed.currentOwner.userId,
      price: deed.price,
      buyer: user.username,
      gold: deed.gold.goldId,
      status: 'PENDING',
    });
    await offer({
      deedOffer: offerId,
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
    const { user, params } = req;
    const { userId } = params;
    const r = await getAllOffers();
    const myOffers = userId === undefined ? r.data.filter(r => r.buyerId.endsWith(`#${user.username}`)) : r.data;
    const p = myOffers.map(async o => {
      try {
        const r2 = await getDeedOfferById(o.deedOffer.split('#')[1]);
        const r4 = await getDeedById(o.deedToBuy.split('#')[1]);
        o.deedToBuy = await getDetailsOfDeed(r4.data);
        const r3 = await getUserById(o.buyerId.split('#')[1]);
        delete r3.data.password;
        delete r3.data.deedOwned;
        delete r3.data.goldOwned;
        o.buyer = r3.data;
        o.deedOffer = r2.data;
        return o;

      } catch (e) {
        console.log(e);
        return undefined;
      }
    });
    return await Promise.all(p).then(async offers => {
      if (userId !== undefined) {
        return res.status(200).send(offers.filter(o => o.deedToBuy.currentOwner.userId === userId));
      }
      return res.status(200).send(offers.filter(o => o.buyer.userId === user.username));
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({message: 'Failed to fetch offers'});
  }
};

const convertGoldToDeed = async (req, res) => {
  const { user, body } = req;
  const { weight, ca, purity, regUser } = body;
  const goldId = uuid4();
  const createGoldData = {
    "$class": "org.acme.goldchain.CreateGold",
    "goldId": goldId,
    "goldWeight": weight,
    "goldPurity": purity,
    "caId": ca,
  };
  const createDeedData = {
    "$class": "org.acme.goldchain.CreateDeed",
    "deedId": uuid4(),
    "goldWeight": weight,
    "listingState": "NOT_LISTED",
    "user": regUser,
    "gold": goldId,
  };
  try {
    await createGold(createGoldData);
    await createDeed(createDeedData);
    return res.status(200).send({message: 'Success'});
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to create gold'});
  }
};

const aasd = async (req, res) => {
  const {user, gold, body} = req;
  const { type } = user;
  if (user === undefined || type !== 'RegisteredUser') {
    return res.status(401).send({message: 'User is not a RegisteredUser'});
  }
  const { deedId, weight, userId, title, price, description, state } = body;

  try {
    await createDeedCa(data);
    return res.status(200).send({message: 'Success'});
  } catch (e) {
    console.log(e);
    return res.status(500).send({message: 'Internal Server Error'});
  }
};

const increaseCashRequest = async (req, res) => {
  const { user, body } = req;
  if (user.type !== 'RegisteredUser') return res.status(401).send({message: 'You are not permitted to top up cash'});
  try {
    await increaseCash({
      "$class": "org.acme.goldchain.UpdateCashRegisteredUser",
      "user": user.username,
      "cash": body.amount,
    });
    return res.status(200).send({message: 'SUCCESS'});
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to increase cash'})
  }
};

const minerCreateGoldRequest = async (req, res) => {
  const { user, body } = req;
  if (user.type !== 'Miner') return res.status(401).send({message: 'You are not a miner'});
  try {
    const { weight, purity } = body;
    await minerCreateGold({
      "$class": "org.acme.goldchain.MinerCreateGold",
      "goldId": uuid4(),
      "goldWeight": weight,
      "goldPurity": purity,
      "miner": user.username,
    });
    return res.status(200).send({message: 'SUCCESS'});
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to increase cash'})
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
  convertGoldToDeed,
  createDeedCaRequest,
  listDeedRequest,
  getAllMinersRequest,
  getAllCasRequest,
  postOfferRequest,
  getMyOffers,
  increaseCashRequest,
  minerCreateGoldRequest,
};