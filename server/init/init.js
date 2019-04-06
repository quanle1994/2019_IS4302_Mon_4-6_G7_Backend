import { api } from '../composer/api';
import {hash} from "../middleware/commons";

const uuid4 = require('uuid4');
const password = (id) => hash(`${id}-password`);

const createMiner = (data) => api
  .post(
    '/org.acme.goldchain.Miner',
    JSON.parse(JSON.stringify(data)),
  );

const createCa = (data) => api
  .post(
    '/org.acme.goldchain.CertificateAuthority',
    JSON.parse(JSON.stringify(data)),
  );

const createUser = (data) => api
  .post(
    '/org.acme.goldchain.RegisteredUser',
    JSON.parse(JSON.stringify(data)),
  );

const minerCreateGold = (data) => api
  .post(
    '/org.acme.goldchain.MinerCreateGold',
    JSON.parse(JSON.stringify(data)),
  );

const goldSaleRequest = (data) => api
  .post(
    '/org.acme.goldchain.GoldSaleRequest',
    JSON.parse(JSON.stringify(data)),
  );

const CAGoldSaleRequest = (data) => api
  .post(
    '/org.acme.goldchain.CAGoldSaleRequest',
    JSON.parse(JSON.stringify(data)),
  );

const minerSellGoldToCA = (data) => api
  .post(
    '/org.acme.goldchain.MinerSellGoldToCA',
    JSON.parse(JSON.stringify(data)),
  );

const createDeed = (data) => api
  .post(
    '/org.acme.goldchain.CreateDeedCa',
    JSON.parse(JSON.stringify(data)),
  );

const listDeedForSale = (data) => api
  .post(
    '/org.acme.goldchain.ListDeedForSale',
    JSON.parse(JSON.stringify(data)),
  );

const minerId = 'miner1';

const miner = {
  "$class": "org.acme.goldchain.Miner",
  "userId": minerId,
  "email": "miner_le@gmail.com",
  "name": "Miner Le",
  "cash": 5000000,
  "password": password(minerId),
  "status": 'ACTIVE',
  "address": "35 Prince George's Park Residences"
};

const miner2 = {
  "$class": "org.acme.goldchain.Miner",
  "userId": "miner2",
  "email": "miner_tan@gmail.com",
  "name": "Miner Tan",
  "cash": 4000000,
  "password": password("miner2"),
  "status": 'ACTIVE',
  "address": "34 Prince George's Park Residences"
};

const miner3 = {
  "$class": "org.acme.goldchain.Miner",
  "userId": "miner3",
  "email": "miner_lam@gmail.com",
  "name": "Miner Lam",
  "cash": 3000000,
  "password": password("miner3"),
  "status": 'ACTIVE',
  "address": "33 Prince George's Park Residences"
};

const pohengId = 'ca1';

const poheng = {
  "$class": "org.acme.goldchain.CertificateAuthority",
  "userId": pohengId,
  "email": "poheng@gmail.com",
  "name": "Po Heng Shop",
  "cash": 15000000,
  "password": password(pohengId),
  "status": 'ACTIVE',
  "address": "32 Prince George's Park Residences"
};

const ca2 = {
  "$class": "org.acme.goldchain.CertificateAuthority",
  "userId": "ca2",
  "email": "pocui@gmail.com",
  "name": "Po Cui Shop",
  "cash": 25000000,
  "password": password("ca2"),
  "status": 'ACTIVE',
  "address": "31 Prince George's Park Residences"
};

const ca3 = {
  "$class": "org.acme.goldchain.CertificateAuthority",
  "userId": "ca3",
  "email": "mama@gmail.com",
  "name": "Mama Shop",
  "cash": 35000000,
  "password": password("ca3"),
  "status": 'ACTIVE',
  "address": "30 Prince George's Park Residences"
};

const aliceId = 'user1';

const alice = {
  "$class": "org.acme.goldchain.RegisteredUser",
  "cash": 1000000,
  "userId": aliceId,
  "email": "alice@gmail.com",
  "name": "Alice Smith",
  "password": password(aliceId),
  "status": 'ACTIVE',
  "address": "29 Prince George's Park Residences"
};

const fatimaId = 'user2';

const fatima = {
  "$class": "org.acme.goldchain.RegisteredUser",
  "cash": 1000000,
  "userId": fatimaId,
  "email": "fatima@gmail.com",
  "name": "Fatima Sharma",
  "password": password(fatimaId),
  "status": 'ACTIVE',
  "address": "28 Prince George's Park Residences"
};

const gold1Id = uuid4();

const cgd1 = {
  "$class": "org.acme.goldchain.MinerCreateGold",
  "goldId": gold1Id,
  "goldWeight": 1000,
  "goldPurity": 99.9,
  "price": 57.5,
  // "ca": `resource:org.acme.goldchain.CertificateAuthority#${pohengId}`,
  "miner": `resource:org.acme.goldchain.Miner#${minerId}`,
};

const gold2Id = uuid4();
const newGold1 = uuid4();
const newGold2 = uuid4();

const cgd2 = {
  "$class": "org.acme.goldchain.MinerCreateGold",
  "goldId": gold2Id,
  "goldWeight": 900,
  "goldPurity": 98.7,
  "price": 58.1,
  // "ca": `resource:org.acme.goldchain.CertificateAuthority#${pohengId}`,
  "miner": `resource:org.acme.goldchain.Miner#${minerId}`,
};

const reqId1 = uuid4();
const reqId2 = uuid4();

const cgr1 = {
  "$class": "org.acme.goldchain.GoldSaleRequest",
  "requestId": reqId1,
  "gold": `resource:org.acme.goldchain.Gold#${gold1Id}`,
  "minerId": `resource:org.acme.goldchain.Miner#${minerId}`,
  "ca": `resource:org.acme.goldchain.CertificateAuthority#${pohengId}`,
  "goldWeight": 900,
  "goldPurity": 99.9,
  "price": 57.5,
  "verificationState": "PENDING",
};

const cgr2 = {
  "$class": "org.acme.goldchain.GoldSaleRequest",
  "requestId": reqId2,
  "gold": `resource:org.acme.goldchain.Gold#${gold2Id}`,
  "minerId": `resource:org.acme.goldchain.Miner#${minerId}`,
  "ca": `resource:org.acme.goldchain.CertificateAuthority#${pohengId}`,
  "goldWeight": 800,
  "goldPurity": 98.7,
  "price": 58.1,
  "verificationState": "PENDING",
};

const msg1 = {
  "$class": "org.acme.goldchain.MinerSellGoldToCA",
  "oldGold": gold1Id,
  "request": reqId1,
  "newGoldId": newGold1,
  "newGoldWeight": 900,
  "ca": `resource:org.acme.goldchain.CertificateAuthority#${pohengId}`,
  "miner": `resource:org.acme.goldchain.Miner#${minerId}`,
};

const msg2 = {
  "$class": "org.acme.goldchain.MinerSellGoldToCA",
  "oldGold": gold2Id,
  "request": reqId2,
  "newGoldId": newGold2,
  "newGoldWeight": 800,
  "ca": `resource:org.acme.goldchain.CertificateAuthority#${pohengId}`,
  "miner": `resource:org.acme.goldchain.Miner#${minerId}`,
};

const deedId = uuid4();

const dd1 = {
  "$class": "org.acme.goldchain.CreateDeedCa",
  "deedId": deedId,
  "goldWeight": 500,
  "listingState": "NOT_LISTED",
  "user": pohengId,
  "gold": newGold1,
};

const deedId2 = uuid4();

const dd2 = {
  "$class": "org.acme.goldchain.CreateDeedCa",
  "deedId": deedId2,
  "goldWeight": 600,
  "listingState": "NOT_LISTED",
  "user": pohengId,
  "gold": newGold2,
};

const deedId3 = uuid4();

const dd3 = {
  "$class": "org.acme.goldchain.CreateDeedCa",
  "deedId": deedId3,
  "goldWeight": 350,
  "listingState": "NOT_LISTED",
  "user": pohengId,
  "gold": newGold1,
};

const ld1 = {
  "$class": "org.acme.goldchain.ListDeedForSale",
  "deedId": deedId,
  "title": "Figaro Men's Necklace",
  "price": 56.32,
  "weightToList": 500,
  "description": "Certified Gold Deed from Trusted CA",
};

const ld2 = {
  "$class": "org.acme.goldchain.ListDeedForSale",
  "deedId": deedId2,
  "title": "Gnova Gold Rhinestone Watch",
  "price": 56.21,
  "weightToList": 600,
  "description": "Sheeny Shiny Tinkly Gold Deed",
};

const ld3 = {
  "$class": "org.acme.goldchain.ListDeedForSale",
  "deedId": deedId3,
  "title": "Despacito Shiny Necklace",
  "price": 57.09,
  "weightToList": 350,
  "description": "No bargain buy only",
};

const execute = async () => {
  try {
    await createMiner(miner);
    await createMiner(miner2);
    await createMiner(miner3);
    await createCa(poheng);
    await createCa(ca2);
    await createCa(ca3);
    await createUser(alice);
    await createUser(fatima);
    // await createGold(cgd1);
    // await createGold(cgd2);
    // await minerSellGoldToCA(cgd1);
    // await minerSellGoldToCA(cgd2);
    await minerCreateGold(cgd1);
    await minerCreateGold(cgd2);

    await goldSaleRequest(cgr1);
    await goldSaleRequest(cgr2);

    await CAGoldSaleRequest({
      "$class": "org.acme.goldchain.CAGoldSaleRequest",
      goldSaleRequest: reqId1
    });
    await CAGoldSaleRequest({
      "$class": "org.acme.goldchain.CAGoldSaleRequest",
      goldSaleRequest: reqId1
    });

    await minerSellGoldToCA(msg1);
    await minerSellGoldToCA(msg2);

    await createDeed(dd1);
    await createDeed(dd2);
    await createDeed(dd3);
    await listDeedForSale(ld1);
    await listDeedForSale(ld2);
    await listDeedForSale(ld3);
  } catch(e) {
    console.log(e.response.config.url);
    console.log(e.response.config.data);
    console.log(e.response.data.error);
  }
};

execute();
