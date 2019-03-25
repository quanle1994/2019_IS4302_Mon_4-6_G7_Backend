require('dotenv').load();
import jwt from 'jsonwebtoken';

const verifyPassword = async (req, res, next) => {
  const {username, password} = req.body;

  try {
    // req.user = await User.findByUsername(username, password);
    if (!stub(username)) {
      console.log(`User ${username} not authorised`);
      res.status(401).send({message: 'Unauthorised User'});
      return;
    }
    req.user = {
      username,
      type: username === users[0] ? 'ADMIN' : username === users[1] ? 'COMMERCIAL' : username === users[2] ? 'CA' : 'MINER',
    };
    next();
  } catch (e) {
    console.log(e);
    res.status(401).send(e);
  }
};

const users = ['quanle@gmail.com', 'alice@gmail.com', 'poheng@gmail.com', 'miner@gmail.com'];

const stub = (username) => users.indexOf(username) >= 0;

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

module.exports = {
  verifyPassword,
  verifyToken
};