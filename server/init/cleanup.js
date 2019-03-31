import axios from 'axios';

const uuid4 = require('uuid4');

const api = axios.create({
  baseURL: 'http://localhost:6000/hlf/api',
  responseType: 'json',
  timeout: 50000,
  contentType: 'application/json',
});

const getMiners = () => api
  .get('/org.acme.goldchain.Miner');

const getCas = () => api
  .get('/org.acme.goldchain.CertificateAuthority');

const getUsers = () => api
  .get('/org.acme.goldchain.RegisteredUser');

const getGolds = () => api
  .get('/org.acme.goldchain.Gold');

const getDeeds = () => api
  .get('/org.acme.goldchain.Deed');

const deleteMiner = (id) => api
  .delete(
    `/org.acme.goldchain.Miner/${id}`
  );

const deleteCa = (id) => api
  .delete(
    `/org.acme.goldchain.CertificateAuthority/${id}`
  );

const deleteUser = (id) => api
  .delete(
    `/org.acme.goldchain.RegisteredUser/${id}`
  );

const deleteGold = (id) => api
  .delete(
    `/org.acme.goldchain.Gold/${id}`
  );

const deleteDeed = (id) => api
  .delete(
    `/org.acme.goldchain.Deed/${id}`
  );

const execute = async () => {
  try {
    const m = await getMiners();
    const c = await getCas();
    const u = await getUsers();
    const g = await getGolds();
    const d = await getDeeds();
    const miners = m.data;
    const cas = c.data;
    const users = u.data;
    const golds = g.data;
    const deeds = d.data;
    miners.forEach(async miner => await deleteMiner(miner.userId));
    cas.forEach(async ca => await deleteCa(ca.userId));
    users.forEach(async user => await deleteUser(user.userId));
    golds.forEach(async gold => await deleteGold(gold.goldId));
    deeds.forEach(async deed => await deleteDeed(deed.deedId))
  } catch(e) {
    console.log(e);
  }
};

execute();
