import * as jwt from "jsonwebtoken";
import {
  api,
  caGoldSale,
  createDeed,
  createDeedCa,
  createDeedOffer,
  createGold,
  createUser,
  getAllCas,
  getAllDeedGolds,
  getAllMiners,
  getAllOffers,
  getCaById,
  getDeedById,
  getDeedOfferById,
  getGoldById,
  getGoldSale,
  getMinerById,
  getUserById,
  goldSale,
  increaseCash, increaseCashCa,
  listDeed,
  minerCreateGold, minerSellGoldToCA,
  offer,
  updatePassword,
  updateUser,
} from '../composer/api';
import {hash} from "../middleware/commons";

const uuid4 = require('uuid4');

require('dotenv').load();

const signInUser = async (req, res) => {
  const token = await generateAuthToken(req.user);
  if (req.user.status !== 'ACTIVE') return res.status(401).send({message: 'User has not been approved yet'});
  return res.header('x-auth', token).status(200).send(req.user);
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
  if (res === undefined) return undefined;
  let ca = res.data;
  delete ca.password;
  delete ca.deedOwned;
  delete ca.goldOwned;
  return ca;
};

const getMinerWithGold = async (id) => {
  const res = await getMinerById(id).catch(e => {
    console.log(e.response.data.error);
    return undefined;
  });
  if (res === undefined) return undefined;
  let miner = res.data;
  try {
    if (miner.goldOwned === undefined) return miner;
    for (let i = 0; i<miner.goldOwned.length; i++) {
      const gold = miner.goldOwned[i];
      const r = await getDetailsOfGold(gold.split('#')[1]);
      miner.goldOwned[i] = r;
    }
    return miner;
  } catch(e) {
    console.log(e);
    return undefined;
  }
};

const getMinerWithGoldRequest = async (req, res) => {
  if (req.user.type !== 'CertificateAuthority') return res.status(401).send({message: 'You must be a Certificate Authority to view this'});
  const miner = await getMinerWithGold(req.params.minerId);
  return res.status(200).send(miner);
};

const getDetailsOfGold = async (id) => {
  const res = await getGoldById(id).catch(e => {
    console.log(e);
    return {};
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
        const r3 = await getUserById('RegisteredUser', o.buyerId.split('#')[1]);
        delete r3.data.password;
        delete r3.data.deedOwned;
        delete r3.data.goldOwned;
        o.buyer = r3.data;
        o.deedOffer = r2.data;
        let r5 = await getCaById(o.deedOffer.owner).catch(() => undefined);
        if (r5 === undefined) r5 = await getUserById('RegisteredUser', o.deedOffer.owner).catch(() => undefined);
        if (r5 !== undefined) o.deedOffer.owner = r5.data;
        return o;

      } catch (e) {
        console.log(e.response.data.error);
        return undefined;
      }
    });
    return await Promise.all(p).then(async offers => {
      if (userId !== undefined) {
        return res.status(200).send(offers.filter(o => o !== undefined && o.deedOffer.owner.userId === userId));
      }
      return res.status(200).send(offers.filter(o => o.buyer.userId === user.username));
    });
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to fetch offers'});
  }
};

const convertGoldToDeed = async (req, res) => {
  const { user, body } = req;
  const { weight, ca, purity, regUser, price } = body;
  const goldId = uuid4();
  const createGoldData = {
    "$class": "org.acme.goldchain.CreateGold",
    "goldId": goldId,
    "goldWeight": weight,
    "goldPurity": purity,
    price,
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

const increaseCashRequestCa = async (req, res) => {
  const { user, body } = req;
  if (user.type !== 'CertificateAuthority') return res.status(401).send({message: 'You are not permitted to top up cash'});
  try {
    const r = await getCaById(user.username);
    const rUser = r.data;
    await increaseCashCa({
      "$class": "org.acme.goldchain.CertificateAuthority",
      userId: rUser.userId,
      password: rUser.password,
      status: rUser.status,
      deedOwned: rUser.deedOwned,
      goldOwned: rUser.goldOwned,
      email: rUser.email,
      name: rUser.name,
      address: rUser.address,
      "cash": body.amount,
    }, rUser.userId);
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
    const { weight, purity, price } = body;
    await minerCreateGold({
      "$class": "org.acme.goldchain.MinerCreateGold",
      "goldId": uuid4(),
      "goldWeight": weight,
      "goldPurity": purity,
      "miner": user.username,
      price,
    });
    return res.status(200).send({message: 'SUCCESS'});
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to create gold'})
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

const registerUserRequest = async (req, res) => {
  try {
    const { userId, email, name, password, address, type } = req.body;
    const u = await getUserById('RegisteredUser', userId).catch(() => undefined);
    if (u !== undefined) {
      return res.status(401).send({message: 'User exists before'});
    }
    const p = hash(`${userId}-${password}`);
    const data = {
      "$class": `org.acme.goldchain.${type}`,
      "userId": userId,
      email,
      name,
      "password": p,
      address,
      "status": "PENDING_APPROVAL",
    };
    await createUser(data, type);
    return res.status(200).send();
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to register user'});
  }
};

const updateUserRequest = async (req, res) => {
  try {
    const { user, body, } = req;
    const { email, name, address, type } = body;
    const u = await getUserById(type, user.username);
    const rUser = u.data;
    const data = {
      "$class": rUser.$class,
      userId: rUser.userId,
      password: rUser.password,
      cash: rUser.cash,
      status: rUser.status,
      deedOwned: rUser.deedOwned,
      goldOwned: rUser.goldOwned,
      email,
      name,
      address,
    };
    await updateUser(data, type, user.username);
    delete data.password;
    data.username = data.userId;
    delete data.userId;
    return res.status(200).send(data);
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to update user'});
  }
};

const updatePasswordRequest = async (req, res) => {
  try {
    const { user, body } = req;
    const { password, newPassword, type } = body;
    const o = hash(`${user.username}-${password}`);
    const u = await getUserById(type, user.username);
    const rUser = u.data;
    if (o !== rUser.password) {
      return res.status(401).send({message: 'Old password is not correct'});
    }
    const data = {
      "$class": `org.acme.goldchain.${type}`,
      userId: rUser.userId,
      cash: rUser.cash,
      status: rUser.status,
      deedOwned: rUser.deedOwned,
      goldOwned: rUser.goldOwned,
      email: rUser.email,
      name: rUser.name,
      address: rUser.address,
      "password": hash(`${user.username}-${newPassword}`),
    };
    await updatePassword(data, type, user.username);
    return res.status(200).send();
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Failed to update user'});
  }
};

const goldSaleRequest = async (req, res) => {
  const { user, gold, body } = req;
  if (user.type !== 'CertificateAuthority') return res.status(401).send({message: 'You are not a Certificate Authority to place this order'});
  const { minerId, goldWeight } = body;
  let requestId = uuid4();
  const data = {
    "$class": "org.acme.goldchain.GoldSaleRequest",
    requestId,
    "gold": `resource:org.acme.goldchain.Gold#${gold.goldId}`,
    "minerId": `resource:org.acme.goldchain.Miner#${minerId}`,
    "ca": `resource:org.acme.goldchain.CertificateAuthority#${user.username}`,
    "goldWeight": goldWeight,
    "goldPurity": gold.goldPurity,
    "price": gold.price,
    "verificationState": "PENDING",
  };
  try {
    await goldSale(data);
    await caGoldSale({
      "$class": "org.acme.goldchain.CAGoldSaleRequest",
      goldSaleRequest: requestId,
    });
    return res.status(200).send({message: 'SUCCESS'});
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Cannot request for gold'})
  }
};

const getSaleRequest = async (req, res) => {
  const { user, body } = req;
  if (user.type !== 'CertificateAuthority') return res.status(401).send({message: 'You are not a Certificate Authority'});
  try {
    const r = await getGoldSale();
    const goldSaleReqs = r.data;
    const reqs = goldSaleReqs.filter(r => r.ca.split('#')[1] === user.username);
    const list = [];
    for (let i = 0; i<reqs.length; i++) {
      const req = reqs[i];
      req.ca = await getDetailsOfCa(req.ca.split('#')[1]);
      req.gold = await getDetailsOfGold(req.gold.split('#')[1]);
      list.push(req);
    }
    console.log(list);
    return res.status(200).send(list);
  } catch (e) {
    console.log(e);
    return res.status(500).send({message: 'Cannot get gold sale request'})
  }
};

const getMyGoldRequests = async (req, res) => {
  const { user, body } = req;
  if (user.type !== 'Miner') return res.status(401).send({message: 'You are not a Miners'});
  try {
    const r = await getGoldSale();
    const goldSaleReqs = r.data;
    const reqs = goldSaleReqs.filter(r => r.minerId.split('#')[1] === user.username);
    const list = [];
    for (let i = 0; i<reqs.length; i++) {
      const req = reqs[i];
      req.gold = await getDetailsOfGold(req.gold.split('#')[1]);
      req.ca = await getDetailsOfCa(req.ca.split('#')[1]);
      list.push(req);
    }
    return res.status(200).send(list);
  } catch (e) {
    console.log(e.response.data.error);
    return res.status(500).send({message: 'Cannot get gold sale requests'})
  }
};

const minerSellsGold = async (req, res) => {
  const { user, gold, body } = req;
  if (user.type !== 'Miner') return res.status(401).send({message: 'You are not a Miners'});
  if (gold.miner.split('#')[1] !== user.username) return res.status(401).send({message: 'You do not own this gold'});
  try {
    const { goldWeight, ca, id } = body;
    const data = {
      "$class": "org.acme.goldchain.MinerSellGoldToCA",
      "oldGold": gold.goldId,
      "request": id,
      "newGoldId": uuid4(),
      "newGoldWeight": goldWeight,
      "ca": `resource:org.acme.goldchain.CertificateAuthority#${ca}`,
      "miner": `resource:org.acme.goldchain.Miner#${user.username}`,
    };
    await minerSellGoldToCA(data);
    return res.status(200).send();
  } catch (e) {
    console.log(e);
    return res.status(500).send({message: 'Cannot sell gold'})
  }
};

module.exports = {
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
  increaseCashRequestCa,
  minerCreateGoldRequest,
  registerUserRequest,
  updateUserRequest,
  updatePasswordRequest,
  getMinerWithGoldRequest,
  goldSaleRequest,
  getSaleRequest,
  getMyGoldRequests,
  minerSellsGold,
};