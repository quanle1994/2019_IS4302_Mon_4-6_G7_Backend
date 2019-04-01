import {getCaById, getDeedById, getMinerById, getUserById} from "../composer/api";
import jwt from 'jsonwebtoken';
import {getDetailsOfDeed, getDetailsOfGold} from "../controllers/userController";
import {hash} from "./commons";
require('dotenv').load();

const verifyPassword = async (req, res, next) => {
  const {username, password} = req.body;

  try {
    let returnedUser = undefined;
    let type = '';
    const admin = stub(username, password);
    if (admin !== undefined) {
      req.user = {
        username,
        name: admin.name,
        type: 'ADMIN',
      };
      return next();
    }
    await getMinerById(username).then(res => {
      returnedUser = res.data;
      type = 'Miner';
    })
      .catch(async err => {
      if (err.response.data.error.statusCode === 404) {
        await getCaById(username).then(res => {
          returnedUser = res.data;
          type = 'CertificateAuthority';
        })
          .catch(async err => {
          if (err.response.data.error.statusCode === 404) {
            await getUserById(username).then(res => {
              returnedUser = res.data;
              type = 'RegisteredUser';
            });
          } else {
            console.log(err.response.data.error);
          }
        });
      }else {
        console.log(err.response.data.error);
      }
    });
    const hashedPassword = hash(`${username}-${password}`);
    if (returnedUser === undefined || hashedPassword !== returnedUser.password) {
      console.log(`Wrong Credentials`);
      res.status(401).send({message: 'Wrong Credentials'});
      return;
    }
    req.user = {
      username,
      name: returnedUser === undefined ? null : returnedUser.name,
      type: type !== '' ? type : 'UNKNOWN',
      money: returnedUser.cash === undefined ? null : returnedUser.cash,
    };
    next();
  } catch (e) {
    console.log(e);
    res.status(401).send(e);
  }
};

const admin = {
  username: 'quanle',
  name: 'LE QUANG QUAN',
  password: 'ERuTWjXkczZA68YTKOaAe5sSiuKF4SbCZPG8kyG5o2M=',
};

const stub = (username, password) => {
  if (admin.username === username && hash(`${admin.username}-${password}`) === admin.password) return admin;
  else return undefined;
};

const verifyToken = async (req, res, next) => {
  const token = req.header('x-auth');

  if (!token) {
    return res.status(401).send('Auth token not found in header');
  }

  try {
    const {access, uid} = jwt.verify(token, process.env.NODE_SECRET);
    if (!uid) {
      return res.status(401).send('Invalid token');
    }
    // req.user = await User.findByUid(uid);
    req.user = {username: uid, type: access};
    next();
  } catch (e) {
    return res.status(401).send(e);
  }
};

const verifyGold = async (req, res, next) => {
  const { goldId } = req.body;
  try {
    const gold = await getDetailsOfGold(goldId);
    if (gold === undefined) throw Error('Gold not found');
    req.gold = gold;
    next();
  } catch (e) {
    console.log(e);
    return res.status(401).send({message: 'Gold not found'});
  }
};

const verifyDeed = async (req, res, next) => {
  const { deedId } = req.body;
  try {
    const deed = await getDeedById(deedId).catch(e => {
      console.log(e);
      return undefined;
    });
    if (deed === undefined) throw Error('Deed not found');
    req.deed = await getDetailsOfDeed(deed.data);
    return next();
  } catch (e) {
    console.log(e);
    return res.status(401).send({message: 'Deed not found'});
  }
};

module.exports = {
  verifyPassword,
  verifyToken,
  verifyGold,
  verifyDeed,
};