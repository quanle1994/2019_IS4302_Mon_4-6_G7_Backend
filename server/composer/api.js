import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:6000/hlf/api',
  responseType: 'json',
  timeout: 10000,
  contentType: 'application/json',
});

const createMiner = (p) => api
  .post(
    '/org.acme.goldchain.Miner',
    JSON.parse(JSON.stringify(p))
  );

const getMinerById = (id) => api
  .get(`/org.acme.goldchain.Miner/${id}`);

const createCA = (p) => api
  .post(
    '/org.acme.goldchain.CertificateAuthority',
    JSON.parse(JSON.stringify(p))
  );

const getCaById = (id) => api
  .get(`/org.acme.goldchain.CertificateAuthority/${id}`);

const getUserById = (id) => api
  .get(`/org.acme.goldchain.RegisteredUser/${id}`);

const getDeedById = (id) => api
  .get(`/org.acme.goldchain.Deed/${id}`);

const getDeedOfferById = (id) => api
  .get(`/org.acme.goldchain.DeedOffer/${id}`);

const getAllDeeds = (id) => api
  .get('/org.acme.goldchain.Deed');

const createGold = (data) => api
  .post(
    '/org.acme.goldchain.CreateGold',
    JSON.parse(JSON.stringify(data)),
  );

const createDeedCa = (data) => api
  .post(
    '/org.acme.goldchain.CreateDeedCa',
    JSON.parse(JSON.stringify(data)),
  );

const createDeed = (data) => api
  .post(
    '/org.acme.goldchain.CreateDeed',
    JSON.parse(JSON.stringify(data)),
  );

const listDeed = (data) => api
  .post(
    '/org.acme.goldchain.ListDeedForSale',
    JSON.parse(JSON.stringify(data)),
  );

const getAllMiners = () => api
  .get('/org.acme.goldchain.Miner');

const getAllCas = () => api
  .get('/org.acme.goldchain.CertificateAuthority');

const getAllRUsers = () => api
  .get('/org.acme.goldchain.RegisteredUser');

const getGoldById = (id) => api
  .get(`/org.acme.goldchain.Gold/${id}`);

const getAllTransactions = () => api
  .get('/system/historian');

const getAllDeedGolds = (id) => api
  .get(
    `/queries/getAllDeedGolds?goldId=resource%3Aorg.acme.goldchain.Gold%23${id}`
  );

const offer = data => api
  .post(
    '/org.acme.goldchain.Offer',
    JSON.parse(JSON.stringify(data)),
  );

const createDeedOffer = data => api
  .post(
    '/org.acme.goldchain.DeedOffer',
    JSON.parse(JSON.stringify(data)),
  );

const getAllOffers = () => api
  .get(
    '/queries/allOfferTx'
  );

const getAllAcceptedOffers = () => api
  .get(
    '/queries/allAcceptOfferTx'
  );

const acceptOffer = (data) => api
  .post(
    '/org.acme.goldchain.AcceptOffer',
    JSON.parse(JSON.stringify(data)),
  );

const delist = (data) => api
  .post(
    'org.acme.goldchain.Delist',
    JSON.parse(JSON.stringify(data)),
  );

const increaseCash = (data) => api
  .post(
    'org.acme.goldchain.UpdateCashRegisteredUser',
    JSON.parse(JSON.stringify(data)),
  );

const minerCreateGold = (data) => api
  .post(
    'org.acme.goldchain.MinerCreateGold',
    JSON.parse(JSON.stringify(data)),
  );

const createUser = (data) => api
  .post(
    'org.acme.goldchain.RegisteredUser',
    JSON.parse(JSON.stringify(data)),
  );

const updateUser = (data) => api
  .put(
    'org.acme.goldchain.RegisteredUser',
    JSON.parse(JSON.stringify(data)),
  );

const updatePassword = (data) => api
  .put(
    'org.acme.goldchain.RegisteredUser',
    JSON.parse(JSON.stringify(data)),
  );

const setStatus = (data) => api
  .put(
    'org.acme.goldchain.RegisteredUser',
    JSON.parse(JSON.stringify(data)),
  );

const goldSale = (data) => api
  .post(
    'org.acme.goldchain.GoldSaleRequest',
    JSON.parse(JSON.stringify(data)),
  );

const caGoldSale = (data) => api
  .post(
    'org.acme.goldchain.CAGoldSaleRequest',
    JSON.parse(JSON.stringify(data)),
  );

module.exports = {
  api,
  createMiner,
  getMinerById,
  createCA,
  getCaById,
  getUserById,
  getDeedById,
  getDeedOfferById,
  getAllDeeds,
  getGoldById,
  createGold,
  createDeedCa,
  createDeed, //User creates deed
  getAllMiners,
  getAllCas,
  getAllRUsers,
  getAllTransactions,
  listDeed,
  getAllDeedGolds,
  offer,
  createDeedOffer,
  getAllOffers,
  getAllAcceptedOffers,
  acceptOffer,
  delist,
  increaseCash,
  minerCreateGold,
  createUser,
  updateUser,
  updatePassword,
  setStatus,
  caGoldSale,
  goldSale,
};
