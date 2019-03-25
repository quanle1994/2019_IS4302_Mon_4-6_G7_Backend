import * as jwt from "jsonwebtoken";
import {poheng} from "../models/fakeModels";

require('dotenv').load();

const signUpUser = async (req, res) => {
  const {name, email, password, phone} = req.body;
  const user = {name, email, password, phone};

  try {
    res.send(user);
  } catch (e) {
    res.status(400).send(e)
  }
};

const signInUser = async (req, res) => {
  const token = await generateAuthToken(req.user);
  res.header('x-auth', token).status(200).send(req.user);
};

const getAllAssets = async (req, res) => {
  const { username } = req.user;
  if (username === 'poheng@gmail.com')
    return res.status(200).send(poheng.assets)
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
};