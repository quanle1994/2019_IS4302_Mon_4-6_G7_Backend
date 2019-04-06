/**
 * Accept Offer
 * @param {org.acme.goldchain.AcceptOffer} txn - the deed
 * @transaction
 */
async function AcceptOffer(txn) {  // eslint-disable-line no-unused-vars
  const deed = txn.deedToBuy;
  const state = deed.listingState;
  const weightToSell = deed.weightListed;
  const weight = deed.goldWeight;
  const isSellWholeDeed = (weightToSell == weight)
  const newDeedId = txn.newDeedId;
  const factory = getFactory();
  const newDeed = factory.newResource('org.acme.goldchain','Deed',newDeedId);
  const deedRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  const userRegistry = await getParticipantRegistry('org.acme.goldchain.RegisteredUser');
  const caRegistry = await getParticipantRegistry('org.acme.goldchain.CertificateAuthority');
  const deedOfferRegistry = await getAssetRegistry('org.acme.goldchain.DeedOffer');
  const list = await caRegistry.getAll();

  if (!deed.offers || deed.offers.length == 0) {
    throw new Error('No offers');
  }

  let indexOfOffer=-1;
  for(let i=0; i<txn.deedToBuy.offers.length; i++){
    if(deed.offers[i].transactionId == txn.offerTxId){
      //throw new Error('match');
      indexOfOffer=i;
      break;
    }
  }
  if(indexOfOffer ==-1){
    throw new Error('Transaction ID not found');
  }

  if (state == 'FOR_1TO1_SALE') {
    const offer = deed.offers[indexOfOffer]
    const seller = deed.currentOwner
    const buyer = offer.buyerId
    const price = offer.deedOffer.offerPrice
    var isCA = false;
    for (var ca of list) {
      if (ca.getFullyQualifiedIdentifier() == seller.getFullyQualifiedIdentifier()) {
        isCA = true;
      }
    }
    seller.cash += price;
    buyer.cash -= price;
    for (let i = 0; i<deed.offers.length; i++) {
      deed.offers[i].deedOffer.status = i === indexOfOffer ? 'APPROVED' : 'REJECTED';
      await deedOfferRegistry.update(deed.offers[i].deedOffer);
    }

    deed.offers = null;
    deed.listingState = 'NOT_LISTED';
    if (isSellWholeDeed) {
      deed.currentOwner = buyer;
      let i;
      for (i=0; i < seller.deedOwned.length; i++) {
        if (seller.deedOwned[i].deedId === deed.deedId) {
          seller.deedOwned.splice(i, 1);                    // only trf the deed
        }
      }
      if(!buyer.deedOwned){
        buyer.deedOwned=[];//Init array
      }
      buyer.deedOwned.push(deed);
      await deedRegistry.update(deed);
      await userRegistry.update(buyer);
      if (isCA) {
        await caRegistry.update(seller);
      } else {
        await userRegistry.update(seller);
      }
    } else {
      deed.weightListed = 0;
      deed.listingState = 'NOT_LISTED';
      deed.goldWeight = weight - weightToSell;
      newDeed.currentOwner = buyer;
      newDeed.goldWeight = weightToSell;
      newDeed.gold = deed.gold;
      newDeed.listingState = 'NOT_LISTED';
      if(!buyer.deedOwned){
        buyer.deedOwned=[];//Init array
      }
      buyer.deedOwned.push(newDeed);
      deed.offers = null;
      deed.weightListed = 0;
      await deedRegistry.update(deed);
      await userRegistry.update(buyer);
      await deedRegistry.add(newDeed);
    }
  } else {
    throw new Error('Only for 1-1 txn');
  }
}



/**
 * Miner Sells Gold to CA
 * @param {org.acme.goldchain.Delist} listing - the offer
 * @transaction
 */
async function Delist(listing) {
  let deed = listing.deed;
  let user = getCurrentParticipant();
  let allowedToDelete = true;
  if (user.getFullyQualifiedIdentifier() != deed.currentOwner.getFullyQualifiedIdentifier() && 			user.getFullyQualifiedType() != 'org.acme.goldchain.CertificateAuthority' &&
    user.getFullyQualifiedType() != 'org.hyperledger.composer.system.NetworkAdmin')
  {
    allowedToDelete = false;
  }
  if (!allowedToDelete) {
    throw new Error('You cannot delist this.');
  }
  const deedReg = await getAssetRegistry('org.acme.goldchain.Deed');
  if (deed.offers !== undefined) {
    const deedOfferReg = await getAssetRegistry('org.acme.goldchain.DeedOffer');
    for (let i = 0; i<deed.offers.length; i++) {
      const o = deed.offers[i];
      o.deedOffer.status = 'REJECTED';
      await deedOfferReg.update(o.deedOffer);
    }
    deed.offers = null;
  }
  deed.listingState = 'NOT_LISTED';
  deed.weightListed = 0;
  await deedReg.update(deed);
}

/**
 * Miner Sells Gold to CA
 * @param {org.acme.goldchain.MinerSellGoldToCA} goldParam - the offer
 * @transaction
 */
async function MinerSellGoldToCA(goldParam) {
  const id = goldParam.newGoldId;
  const newWeight = goldParam.newGoldWeight;
  const miner = goldParam.miner;
  const ca = goldParam.ca;
  const factory = getFactory();
  let minerRegistry = await getParticipantRegistry('org.acme.goldchain.Miner');
  let minerExist = await minerRegistry.get(miner.getIdentifier());
  if (minerExist === undefined) {
    throw new Error('This miner does not exist!');
  }
  //Check if miner owns the gold
  let checker =-1;
  for(let g=0; g<miner.goldOwned.length;g++){
    if(miner.goldOwned[g].getFullyQualifiedIdentifier() == goldParam.oldGold.getFullyQualifiedIdentifier()){
      checker=1;
      if(!miner.goldOwned){
        throw new Error('Miner does not own this gold');
      }
    }
  }
  if(checker==-1){
    throw new Error('Miner does not own this gold');
  }

  //check if newGold newWeight more than old goldnewWeight
  if(newWeight>goldParam.oldGold.goldWeight){
    let exceeded =newWeight-goldParam.oldGold.goldWeight;
    throw new Error('Weight exceeded by: '+ exceeded);
  }
  const assetRegistry = await getAssetRegistry('org.acme.goldchain.Gold');

  //check if ca has enough cash balance
  let cost = parseInt(goldParam.oldGold.price * goldParam.newGoldWeight);
  if (ca.cash < cost)
    throw new Error('CA does not have sufficient cash to make this purchase');

  if(newWeight==goldParam.oldGold.goldWeight){
    //transfer as whole
    //for(let g of miner.goldOwned){
    for(let g=0; g<miner.goldOwned.length;g++){
      if(miner.goldOwned[g].getFullyQualifiedIdentifier() == goldParam.oldGold.getFullyQualifiedIdentifier()){
        //if match gold then transfer as whole
        //add to ca
        if(!ca.goldOwned){
          ca.goldOwned=[];
        }
        g.verifiedBy = ca;
        await assetRegistry.update(g);
        ca.goldOwned.push(miner.goldOwned[g]);
        ca.cash -= cost;
        await participantRegistry.update(ca);
        // remove from miner
        miner.goldOwned.splice(g, 1);
        miner.cash += cost;
        await minerRegistry.update(miner);
        //update participant registry
        // Get the certificate authority participant registry.
        const participantRegistry = await getParticipantRegistry('org.acme.goldchain.CertificateAuthority');
        const goldSaleReqReg = await getAssetRegistry('org.acme.goldchain.GoldSaleRequest');
        // const goldSaleReq = await goldSaleReqReg.get(goldParam.request);
        const goldSaleReq = goldParam.request;
        goldSaleReq.verificationState = 'APPROVED';
        await goldSaleReqReg.update(goldSaleReq);
        await participantRegistry.update(ca);
        await minerRegistry.update(miner);
      }

    }
  }

  //if newnewWeight less than: subtract and create new gold
  if(newWeight<goldParam.oldGold.goldWeight){
    //create new gold
    var gold = factory.newResource("org.acme.goldchain", "Gold", id);
    gold.goldWeight = newWeight;
    gold.goldPurity = goldParam.oldGold.goldPurity;
    gold.verifiedBy = ca;
    gold.miner = miner;
    gold.price = goldParam.oldGold.price;
    await assetRegistry.add(gold);

    // Get the certificate authority participant registry.
    let participantRegistry = await getParticipantRegistry('org.acme.goldchain.CertificateAuthority');

    //subtract from old gold

    for(let g of miner.goldOwned){
      if(g.getFullyQualifiedIdentifier() == goldParam.oldGold.getFullyQualifiedIdentifier()){
        //if match gold then subtract
        let toSubtract = goldParam.oldGold.goldWeight - newWeight;
        g.goldWeight = toSubtract;
        await assetRegistry.update(g);
        break;
      }
    }

    //Push gold to CA
    if(!ca.goldOwned){
      ca.goldOwned=[];//Init array
    }
    ca.cash -= cost;
    await participantRegistry.update(ca);
    miner.cash += cost;
    await minerRegistry.update(miner);
    await ca.goldOwned.push(gold);
    await participantRegistry.update(ca);
    await minerRegistry.update(miner);
    const goldSaleReqReg = await getAssetRegistry('org.acme.goldchain.GoldSaleRequest');
    // const goldSaleReq = await goldSaleReqReg.get(goldParam.request);
    const goldSaleReq = goldParam.request;
    goldSaleReq.verificationState = 'APPROVED';
    await goldSaleReqReg.update(goldSaleReq);
  }

}



/**   ===== use userclaimgold under ca instead ===========
 * Claim physical gold in exchange for deed
 * @param {org.acme.goldchain.goldClaim} goldParam - the offer
 * @transaction
 */
/*
async function goldClaim(goldParam) {
    const id = goldParam.deedId;
    let deedAssetReg = await getAssetRegistry('org.acme.goldchain.Deed');
    //********in progress*****************
}*/

/**
 * Certificate Authority update miner Gold Sale Request
 * @param {org.acme.goldchain.CAGoldSaleRequest} args
 * @transaction
 */
async function caGoldSaleRequest(newRequest) {
  const goldRegistry = await getAssetRegistry('org.acme.goldchain.Gold');
  const request = newRequest.goldSaleRequest;
  let gold = await goldRegistry.get(request.gold.goldId);
  if(gold.goldWeight<request.goldWeight){
    let exceeded = request.goldWeight - gold.goldWeight;
    throw new Error("Gold weight exceeded by: " + exceeded);
  }

  //Check if miner owns the gold
  let checker =-1;
  for(let g=0; g<request.minerId.goldOwned.length; g++){
    if(request.minerId.goldOwned[g].getFullyQualifiedIdentifier() == request.gold.getFullyQualifiedIdentifier()){
      checker=1;
      if(!request.minerId.goldOwned){
        throw new Error('Miner does not own this gold');
      }
    }
  }
  if(checker==-1){
    throw new Error('Miner does not own this gold');
  }
}
// ****** CRUD GOLD ******
/**
 * Miner create his own gold
 * @param {org.acme.goldchain.MinerCreateGold} goldParam - the offer
 * @transaction
 */
async function MinerCreateGold(goldParam) {
  const id = goldParam.goldId;
  const weight = goldParam.goldWeight;
  const purity = goldParam.goldPurity;
  const miner = goldParam.miner;
  // const ca = goldParam.ca;
  var factory = getFactory();
  var gold = factory.newResource("org.acme.goldchain", "Gold", id);
  gold.goldWeight = weight;
  gold.goldPurity = purity;
  //gold.verifiedBy = ca;
  gold.miner = miner;
  gold.price = goldParam.price;
  let assetRegistry = await getAssetRegistry('org.acme.goldchain.Gold');
  await assetRegistry.add(gold);

  // Get the certificate authority participant registry.
  let participantRegistry = await getParticipantRegistry('org.acme.goldchain.Miner');
  if(miner.goldOwned === undefined || miner.goldOwned.length === 0){
    miner.goldOwned=[];//Init array
  }

  await miner.goldOwned.push(gold);
  await participantRegistry.update(miner);
}

/**
 * Create Gold
 * @param {org.acme.goldchain.CreateGold} newGold - the offer
 * @transaction
 */
async function createGold(newGold) {
  let factory = getFactory();
  const registry = await getAssetRegistry("org.acme.goldchain.Gold");
  let resource = factory.newResource("org.acme.goldchain", "Gold", newGold.goldId);
  resource.goldWeight = newGold.goldWeight;
  resource.goldPurity = newGold.goldPurity;
  resource.price = newGold.price;

  // Get the certificate authority participant registry.
  let participantRegistry = await getParticipantRegistry('org.acme.goldchain.CertificateAuthority');
  let ca = await participantRegistry.get(newGold.caId);
  //var arrayGoldOwned = ca.goldOwned;
  if(ca.goldOwned === undefined || ca.goldOwned.length == 0){
    ca.goldOwned=[];//Init array
  }

  //Create gold
  resource.photoDirs = newGold.photoDirs;
  resource.verifiedBy = ca;
  await registry.add(resource);
  //Push gold to CA
  if(!ca.goldOwned){
    ca.goldOwned=[];//Init array
  }
  await ca.goldOwned.push(resource);
  await participantRegistry.update(ca);
}

/**
 * Get all Gold Asset
 * @param {org.acme.goldchain.GetAllGold} gold - the offer
 * @transaction
 */
async function getAllGold(gold) {
  let assetRegistry = await getAssetRegistry('org.acme.goldchain.Gold');
  let results = await query('getAllGold');
  return results;
}

/**
 * Get Gold Asset by ID
 * @param {org.acme.goldchain.GetGoldById} param - the offer
 * @transaction
 */
async function getGoldById(param) {
  let goldId = param.goldId;
  // Get the gold asset registry.
  return getAssetRegistry('org.acme.goldchain.Gold')
    .then(function (goldAssetRegistry) {
      // Get the specific gold from the gold asset registry.
      return goldAssetRegistry.get(goldId);
    })
    .then(function (gold) {
      // Process the gold object.
      // console.log(gold.goldId);
      return gold;
    })
    .catch(function (error) {
      // Add optional error handling here.
      throw new Error('Gold cannot be found: ' + goldId);
    });
}

/**
 * Update Gold
 * @param {org.acme.goldchain.UpdateGold} goldParam - the offer
 * @transaction
 */
async function updateGold(goldParam) {
  const id = goldParam.goldId;
  const goldAssetRegistry = await getAssetRegistry('org.acme.goldchain.Gold');
  const gold = await goldAssetRegistry.get(id);
  gold.goldWeight = goldParam.goldWeight;
  gold.goldPurity = goldParam.goldPurity;
  gold.verifiedBy = goldParam.ca;
  gold.miner = goldParam.miner;
  gold.photoDirs  = goldParam.photoDirs;
  await goldAssetRegistry.update(gold);
}

/**
 * Delete Gold
 * @param {org.acme.goldchain.DeleteGoldById} gold - the offer
 * @transaction
 */
async function DeleteGoldById(gold) {
  let factory = getFactory();
  const id = gold.goldId;
  const goldAssetRegistry = await getAssetRegistry("org.acme.goldchain.Gold");
  /* let resource = factory.newResource("org.acme.goldchain", "Gold", gold.goldId); */

  var currentParticipant = getCurrentParticipant();

  const deedAssetRegistry = await getAssetRegistry("org.acme.goldchain.Deed");
  let allDeeds = await deedAssetRegistry.getAll();

  for (var deed of allDeeds) {
    let deedGold = await goldAssetRegistry.get(deed.gold.getIdentifier());
    if (deedGold.getIdentifier() === id) {
      throw new Error('There is a deed with this gold!');
    }
  }

  const participantRegistry = await getParticipantRegistry('org.acme.goldchain.CertificateAuthority');
  let ca = await participantRegistry.get(currentParticipant.getIdentifier());

  let i;
  for (i=0; i < ca.goldOwned.length; i++) {
    if (ca.goldOwned[i].getIdentifier() === gold.goldId) {
      ca.goldOwned.splice(i, 1);                    // remove the gold from certificate authority
    }
  }

  //Remove gold from goldOwned
  await goldAssetRegistry.remove(id);
  await participantRegistry.update(ca);
}

// ************************

// ****** CRUD Deed ******
/**
 * Create Deed, set currentOwner as RegisteredUser
 * @param {org.acme.goldchain.CreateDeed} newDeed - the createDeed transaction
 * @transaction
 */
async function createDeed(newDeed) {
  let factory = getFactory();
  let assetRegistry = await getAssetRegistry("org.acme.goldchain.Deed");
  let goldRegistry = await getAssetRegistry("org.acme.goldchain.Gold");

  const gold = newDeed.gold;
  if (gold.miner == undefined) {
    if (gold.goldWeight != newDeed.goldWeight) {
      throw new Error('User gold cannot be split');
    }
  }

  let resource = await factory.newResource("org.acme.goldchain", "Deed", newDeed.deedId);
  resource.goldWeight = newDeed.goldWeight;
  resource.listingState = newDeed.listingState;
  resource.title = newDeed.title;
  resource.price = newDeed.price;
  resource.description = newDeed.description;

  resource.gold = newDeed.gold;

  resource.currentOwner = newDeed.user;

  let allDeeds = await assetRegistry.getAll();
  let sumOfDeedGold = 0 + 0;


  for (var deed of allDeeds) {
    let deedGold = await goldRegistry.get(deed.gold.getIdentifier()); //cannnot direct access gold from assetRegistry.getAll(), must get from gold registry again
    if (deedGold.getFullyQualifiedIdentifier() === newDeed.gold.getFullyQualifiedIdentifier()) {
      sumOfDeedGold = sumOfDeedGold + deed.goldWeight;
    }
  }
  if (sumOfDeedGold + newDeed.goldWeight > newDeed.gold.goldWeight) {
    let exceed = sumOfDeedGold + newDeed.goldWeight - newDeed.gold.goldWeight;
    throw new Error('Weight exceeded by: ' + exceed);
  }
  resource.photoDirs = newDeed.photoDirs;
  await assetRegistry.add(resource);

  //let arrayDeedOwned = newDeed.user.deedOwned; //Don't do this, creating new array
  //let arrayGoldOwned = newDeed.user.goldOwned;
  if(!newDeed.user.deedOwned){
    newDeed.user.deedOwned=[];//Init array
  }
  /*if(!newDeed.user.goldOwned){
     newDeed.user.goldOwned=[];//Init array
     }*/
  let participantRegistry = await getParticipantRegistry('org.acme.goldchain.RegisteredUser');
  newDeed.user.deedOwned.push(resource);
  //newDeed.user.goldOwned.push(resource.gold);
  await participantRegistry.update(newDeed.user); //Update the user
}

/**
 * Create Deed, set currentOwner as CertificateAuthority
 * @param {org.acme.goldchain.CreateDeedCa} newDeed - the createDeed transaction
 * @transaction
 */
async function createDeedCa(newDeed) {
  let factory = getFactory();
  let assetRegistry = await getAssetRegistry("org.acme.goldchain.Deed");
  let goldRegistry = await getAssetRegistry("org.acme.goldchain.Gold");

  const gold = newDeed.gold;
  if (gold.miner == undefined) {
    if (gold.goldWeight != newDeed.goldWeight) {
      throw new Error('User gold cannot be split');
    }
  }

  let resource = await factory.newResource("org.acme.goldchain", "Deed", newDeed.deedId);
  resource.goldWeight = newDeed.goldWeight;
  resource.listingState = newDeed.listingState;
  resource.title = newDeed.title;
  resource.price = newDeed.price;
  resource.description = newDeed.description;

  resource.gold = newDeed.gold;

  resource.currentOwner = newDeed.user;

  let allDeeds = await assetRegistry.getAll();
  let sumOfDeedGold = 0 + 0;


  for (var deed of allDeeds) {
    let deedGold = await goldRegistry.get(deed.gold.getIdentifier()); //cannnot direct access gold from assetRegistry.getAll(), must get from gold registry again
    if (deedGold.getFullyQualifiedIdentifier() === newDeed.gold.getFullyQualifiedIdentifier()) {
      sumOfDeedGold = sumOfDeedGold + deed.goldWeight;
    }
  }
  if (sumOfDeedGold + newDeed.goldWeight > newDeed.gold.goldWeight) {
    let exceed = sumOfDeedGold + newDeed.goldWeight - newDeed.gold.goldWeight;
    throw new Error('Weight exceeded by: ' + exceed);
  }
  resource.photoDirs = newDeed.photoDirs;
  await assetRegistry.add(resource);

  //CA don't need to add into goldOwned because already owned during CREATEGOLD tx
  let arrayDeedOwned = newDeed.user.deedOwned;
  if(!newDeed.user.deedOwned){
    newDeed.user.deedOwned=[];//Init array
  }

  let participantRegistry = await getParticipantRegistry('org.acme.goldchain.CertificateAuthority');
  newDeed.user.deedOwned.push(resource);
  await participantRegistry.update(newDeed.user); //Update the user
}

/**
 * Get all Deed
 * @param {org.acme.goldchain.GetAllDeed} deed - the getAllDeed transaction
 * @transaction
 */
async function getAllDeed(deed) {
  let assetRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  let results = await query('getAllDeed');
  return results;
}

/**
 * Get Deed Asset by ID
 * @param {org.acme.goldchain.GetDeedById} param - the getDeedById transaction
 * @transaction
 */
async function getDeedById(param) {
  let deedId = param.deedId;
  // Get the deed asset registry.
  return getAssetRegistry('org.acme.goldchain.Deed')
    .then(function (deedAssetRegistry) {
      // Get the specific deed from the deed asset registry.
      return deedAssetRegistry.get(deedId);
    })
    .then(function (deed) {
      // Process the deed object.
      // console.log(deed.deedId);
      return deed;
    })
    .catch(function (error) {
      // Add optional error handling here.
      throw new Error('Deed cannot be found: ' + deedId);
    });
}

/**
 * Update Deed
 * @param {org.acme.goldchain.UpdateDeed} deedParam - the updateDeed transaction
 * @transaction
 */
async function updateDeed(deedParam) {
  const id = deedParam.deedId;
  const deedAssetRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  const deed = await deedAssetRegistry.get(id);
  deed.goldWeight = deedParam.goldWeight;
  deed.offers = deedParam.offers;
  deed.listingState = deedParam.listingState
  deed.title = deedParam.title;
  deed.price = deedParam.price;
  deed.description = deedParam.description;
  deed.currentOwner = deedParam.userId
  deed.gold = deedParam.goldId
  deed.photoDirs = deedParam.photoDirs;
  await deedAssetRegistry.update(deed);
}

/**
 * Delete Deed
 * @param {org.acme.goldchain.DeleteDeedById} deed - the deleteDeedById transaction
 * @transaction
 */
async function deleteDeedById(deed) {
  /* const id = deed.deedId;
  let assetRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  await assetRegistry.remove(id); */

  let factory = getFactory();
  const deedId = deed.deedId;
  const assetRegistry = await getAssetRegistry("org.acme.goldchain.Deed");

  // var currentParticipant = getCurrentParticipant();

  let allDeeds = await participantRegistry.getAll();

  for (var deed of allDeeds) {
    let deedGold = await assetRegistry.get(deed.gold.getIdentifier());
    if (deedGold.getIdentifier() === id) {
      throw new Error('There is a deed with this gold!');
    }
  }

  // let user = await participantRegistry.get(currentParticipant.getIdentifier());

  let i;
  for (i=0; i < user.deedOwned.length; i++) {
    if (user.deedOwned[i].getIdentifier() === deed.deedId) {
      user.deedOwned.splice(i, 1);                    // remove the deed from registered user
    }
  }

  //Remove gold from goldOwned
  await assetRegistry.remove(deedId);
  await participantRegistry.update(user);
}

// ****** User ******

/**
 * Update Cash Registered User
 * @param {org.acme.goldchain.UpdateCashRegisteredUser} idpw - Update email name and password after entering OLD id and pw
 * @transaction
 */
async function updateCashRegisteredUser(idpw) {
  let participantRegistry = await getParticipantRegistry('org.acme.goldchain.RegisteredUser');
  //let participant = await participantRegistry.get(idpw.userId);
  idpw.user.cash =idpw.user.cash + idpw.cash;
  await participantRegistry.update(idpw.user);
}

/**
 * Update Registered User
 * @param {org.acme.goldchain.UpdateRegisteredUser} idpw - Update email name and password after entering OLD id and pw
 * @transaction
 */
async function updateRegisteredUser(idpw) {
  let userObj1;
  return getParticipantRegistry('org.acme.goldchain.RegisteredUser')
    .then(function (participantRegistry) {
      return participantRegistry.get(idpw.oldUserId);
    })
    .then(function (userObj) {
      if (userObj.password === idpw.oldPassword) {
        // Get the vehicle asset registry.
        return getParticipantRegistry('org.acme.goldchain.RegisteredUser')
          .then(function (vehicleAssetRegistry) {
            // Get the factory for creating new asset instances.
            var factory = getFactory();
            // Modify the properties of the vehicle.
            userObj.email = idpw.email;
            userObj.name = idpw.name;
            userObj.password = idpw.password;
            // Update the vehicle in the vehicle asset registry.
            return vehicleAssetRegistry.update(userObj);
          })
          .catch(function (error) {
            // Add optional error handling here.
            throw new Error(error);
          });
      } else {
        throw new Error('Userid and Password do not match');
      }
    })
    .catch(function (error) {
      throw new Error(error);
    });
}

/**
 * Registered User Login
 * @param {org.acme.goldchain.LoginAsRegisteredUser} idpw - returns boolean if success
 * @transaction
 */
async function loginAsRegisteredUser(idpw) {
  return getParticipantRegistry('org.acme.goldchain.RegisteredUser')
    .then(function (participantRegistry) {
      return participantRegistry.get(idpw.userId);
    })
    .then(function (userObj) {
      if (userObj.password === idpw.password) {
        return true;
      } else {
        throw new Error('Userid and Password do not match');
      }
    })
    .catch(function (error) {
      throw new Error(error);
    });
}

/**
 * Close Bidding
 * @param {org.acme.goldchain.CloseBidding} closeBidding - the offer
 * @transaction
 */
async function closeBidding(closeBidding) {  // eslint-disable-line no-unused-vars
  const listing = closeBidding.deedToClose;
  const gold = listing.gold;
  const weight = listing.goldWeight; //the weight of the deed i have listed
  const state = listing.listingState;
  const weightToSell = listing.weightListed;//the weight i want to sell
  const newDeedId = closeBidding.newDeedId;
  const isSellWholeDeed = (weightToSell == weight)
  const factory = getFactory();
  const newDeed = factory.newResource('org.acme.goldchain','Deed',newDeedId)
  const deedRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  const userRegistry = await getParticipantRegistry('org.acme.goldchain.RegisteredUser');

  if (state == 'AUCTION') {
    let seller = listing.currentOwner;
    //let lengthOfDeedOwned = seller.deedOwned.length;
    let highestOffer = null;
    let buyer = null;
    if (listing.offers && listing.offers.length > 0) {
      // sort the bids by bidPrice
      listing.offers.sort(function (a, b) {
        return (b.offerPrice - a.offerPrice);
      });
      highestOffer = listing.offers[0];
      // mark the listing as SOLD
      buyer = highestOffer.buyerId;
      seller.cash += highestOffer.offerPrice;
      buyer.cash -= highestOffer.offerPrice;

      if (isSellWholeDeed) {
        listing.listingState = 'NOT_LISTED';
        listing.currentOwner = buyer;
        let i;
        for (i=0; i < seller.deedOwned.length; i++) { // remove the deed from seller
          if (seller.deedOwned[i].deedId === listing.deedId) {
            seller.deedOwned.splice(i, 1);
          }
        }
        if(!buyer.deedOwned){
          buyer.deedOwned=[];//Init array
        }
        let buyersDeeds = buyer.deedOwned;
        buyer.deedOwned = buyersDeeds.push(listing);
        listing.offers = null;
        listing.weightListed = 0;
        await deedRegistry.update(listing);
        await userRegistry.updateAll([buyer,seller]);
      } else {
        listing.listingState = 'NOT_LISTED';
        listing.goldWeight = weight - weightToSell;
        newDeed.currentOwner = buyer;
        newDeed.gold = gold;
        newDeed.listingState = 'NOT_LISTED';
        newDeed.goldWeight = weightToSell;
        if(!buyer.deedOwned){
          buyer.deedOwned=[];//Init array
        }
        buyer.deedOwned.push(newDeed);
        listing.offers = null;
        listing.weightListed = 0;
        await deedRegistry.update(listing);
        await userRegistry.update(buyer);
        await deedRegistry.add(newDeed);
      }
    }
  } else {
    throw new Error('Listing is not up for auction');
  }
}

/**
 * Make an Offer for a DeedListing
 * @param {org.acme.goldchain.Offer} offer - the offer
 * @transaction
 */
async function Offer(offer) {  // eslint-disable-line no-unused-vars
  let listing = offer.deedToBuy;
  const state = listing.listingState;
  if (state == 'AUCTION' || state == 'FOR_1TO1_SALE') {

    let assetRegistry = await getAssetRegistry("org.acme.goldchain.Deed");
    let allDeeds = await assetRegistry.getAll();
    let sumOfOffers = 0+0;
    for (var deed of allDeeds) {
      let deedAsset = await assetRegistry.get(deed.getIdentifier()); //cannnot direct access gold from assetRegistry.getAll(), must get from gold registry again
      let deedOffers = deedAsset.offers;
      //throw new Error(deedOffers[0].offerPrice);
      if(deedOffers){
        //if array is not empty then add the offerprice
        for(let doffer of deedOffers){
          if(doffer.buyerId.getFullyQualifiedIdentifier() ===  offer.buyerId.getFullyQualifiedIdentifier()){//check if buyer
            sumOfOffers = sumOfOffers + doffer.offerPrice;
          }
        }
      }
    }
    //throw new Error('user cash: '+offer.buyerId.cash+' total Bid: '+sumOfOffers);
    //check if user enough money
    if(sumOfOffers + offer.deedOffer.offerPrice > offer.buyerId.cash){
      let exceeded = sumOfOffers + offer.deedOffer.offerPrice-offer.buyerId.cash;
      throw new Error( 'Insufficient funds, additional amount needed: $'+exceeded);
    }
    if (listing.offers == null) {
      listing.offers = [];//init array
    }
    for (i=0; i < listing.offers.length; i++) {
      //if same person, remove
      if (listing.offers[i].buyerId == offer.buyerId) {
        listing.offers.splice(i,1);
      }
    }
    listing.offers.push(offer);//add back with latest offer
  }else{
    throw new Error('Listing is not FOR SALE');
  }
  // save the Deed
  const deedRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  await deedRegistry.update(listing);

}

/* async function ListDeedForAuction(offer) {  // eslint-disable-line no-unused-vars
    if (offer.deedId.listingState != 'NOT_LISTED') {
		throw new Error('This deed is not available for listing!');
	}
  	offer.deedId.title = offer.title;
  	offer.deedId.price = offer.price;
  	offer.deedId.description = offer.description;
	const deed = offer.deedId;
    deed.listingState = 'AUCTION'
    const deedRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
    await deedRegistry.update(deed);
} */

/**
 * Put a deed for auction
 * @param {org.acme.goldchain.ListDeedForAuction} deed - the deed
 * @transaction
 */
async function ListDeedForAuction(offer) {  // eslint-disable-line no-unused-vars
  if (offer.deedId.listingState != 'NOT_LISTED') {
    throw new Error('This deed is not available for listing!');
  }
  let weightToSell = offer.weightToList
  offer.deedId.title = offer.title;
  offer.deedId.price = offer.price;
  offer.deedId.description = offer.description;
  const deed = offer.deedId
  let deedWeight = deed.goldWeight
  if (weightToSell > deedWeight) {
    throw new Error("Listing more than the deed's weight");
  }
  deed.weightListed = weightToSell;
  deed.listingState = 'AUCTION'
  const deedRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  await deedRegistry.update(deed);
}

/**
 * Put a deed for 1 to 1 sale
 * @param {org.acme.goldchain.ListDeedForSale} deed - the deed
 * @transaction
 */
async function ListDeedForSale(offer) {  // eslint-disable-line no-unused-vars
  const deed = offer.deedId;
  const gold = deed.gold;
  if (gold.miner == undefined) {
    if (offer.weightToList != deed.goldWeight) {
      throw new Error('User gold cannot be split');
    }
  }
  if (offer.deedId.listingState != 'NOT_LISTED') {
    throw new Error('This deed is not available for listing!');
  }
  let weightToSell = offer.weightToList
  if (weightToSell > deed.goldWeight) {
    throw new Error("Listing more than the deed's weight");
  }

  deed.weightListed = offer.weightToList;
  offer.deedId.title = offer.title;
  offer.deedId.price = offer.price;
  offer.deedId.description = offer.description;
  deed.listingState = 'FOR_1TO1_SALE'
  const deedRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  await deedRegistry.update(deed);
}

























/**
 * Update an Offer for a Listed Deed
 * @param {org.acme.goldchain.UpdateOffer} args
 * @transaction
 */
async function updateOffer(args) {
  let listingLength = args.deedListing.offers.length;
  let i;
  for(i=0;i<listingLength;i++){
    let buyer = args.deedListing.offers[i].buyerId;
    if (buyer.userId === getCurrentParticipant().userId) {
      args.deedListing.offers[i].offerPrice = args.newOfferPrice;
    }
  };

  let deedListingRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  await deedListingRegistry.update(args.deedListing);
}

/**
 * User submit Gold Verfication Request
 * @param {org.acme.goldchain.UserSubmitGoldVerificationRequest} args
 * @transaction
 */
async function userSubmitGoldVerificationRequest(newRequest) {
  let registeredUserRegistry = await getParticipantRegistry('org.acme.goldchain.RegisteredUser');
  let certificateAuthorityRegistry = await getParticipantRegistry('org.acme.goldchain.CertificateAuthority');
  let userId = newRequest.userId.userId;
  let caId = newRequest.caId.userId;
  let userExists = await registeredUserRegistry.exists(userId);
  let caExists = await certificateAuthorityRegistry.exists(caId);
  if (!userExists) {
    throw new Error("Registered User ID " + userId + " not found");
  }
  if (!caExists) {
    throw new Error("Certificate Authority ID " + caId + " not found");
  }
}

/**
 * User submit Deed Redemption Request
 * @param {org.acme.goldchain.UserSubmitDeedRedemptionRequest} args
 * @transaction
 */
async function userSubmitDeedRedemptionRequest(newRequest) {
  let registeredUserRegistry = await getParticipantRegistry('org.acme.goldchain.RegisteredUser');
  let certificateAuthorityRegistry = await getParticipantRegistry('org.acme.goldchain.CertificateAuthority');
  let deedRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  let userId = newRequest.userId.userId;
  let caId = newRequest.caId.userId;
  let deedId = newRequest.deedId.deedId;
  let userExists = await registeredUserRegistry.exists(userId);
  let caExists = await certificateAuthorityRegistry.exists(caId);
  let deedExists = await deedRegistry.exists(deedId);
  if (!deedExists) {
    throw new Error("Deed ID " + deedId + " not found");
  }
  if (!userExists) {
    throw new Error("Registered User ID " + userId + " not found");
  }
  if (!caExists) {
    throw new Error("Certificate Authority ID " + caId + " not found");
  }
}

// ************************

// ****** Miner ******

/**
 * Update Miner
 * @param {org.acme.goldchain.UpdateMiner} idpw - Update email name and password after entering OLD id and pw
 * @transaction
 */
async function updateMiner(idpw) {
  let userObj1;
  return getParticipantRegistry('org.acme.goldchain.Miner')
    .then(function (participantRegistry) {
      return participantRegistry.get(idpw.oldUserId);
    })
    .then(function (userObj) {
      if (userObj.password === idpw.oldPassword) {
        // Get the vehicle asset registry.
        return getParticipantRegistry('org.acme.goldchain.Miner')
          .then(function (vehicleAssetRegistry) {
            // Get the factory for creating new asset instances.
            var factory = getFactory();
            // Modify the properties of the vehicle.
            userObj.email = idpw.email;
            userObj.name = idpw.name;
            userObj.password = idpw.password;
            // Update the vehicle in the vehicle asset registry.
            return vehicleAssetRegistry.update(userObj);
          })
          .catch(function (error) {
            // Add optional error handling here.
            throw new Error(error);
          });
      } else {
        throw new Error('Userid and Password do not match');
      }
    })
    .catch(function (error) {
      throw new Error(error);
    });
}

/**
 * Miner Login
 * @param {org.acme.goldchain.LoginAsMiner} idpw - returns boolean if success
 * @transaction
 */
async function loginAsMiner(idpw) {
  return getParticipantRegistry('org.acme.goldchain.Miner')
    .then(function (participantRegistry) {
      return participantRegistry.get(idpw.userId);
    })
    .then(function (userObj) {
      if (userObj.password === idpw.password) {
        //throw new Error('login success');
        return true;
      } else {
        throw new Error('Userid and Password do not match');
      }
    })
    .catch(function (error) {
      throw new Error(error);
    });
}


// ************************

// ****** Certificate Authority ******

/**
 * Update Certificate Authority
 * @param {org.acme.goldchain.UpdateCertificateAuthority} idpw - Update email name and password after entering OLD id and pw
 * @transaction
 */
async function updateCertificateAuthority(idpw) {
  let userObj1;
  return getParticipantRegistry('org.acme.goldchain.CertificateAuthority')
    .then(function (participantRegistry) {
      return participantRegistry.get(idpw.oldUserId);
    })
    .then(function (userObj) {
      if (userObj.password === idpw.oldPassword) {
        // Get the vehicle asset registry.
        return getParticipantRegistry('org.acme.goldchain.CertificateAuthority')
          .then(function (vehicleAssetRegistry) {
            // Get the factory for creating new asset instances.
            var factory = getFactory();
            // Modify the properties of the vehicle.
            userObj.email = idpw.email;
            userObj.name = idpw.name;
            userObj.password = idpw.password;
            // Update the vehicle in the vehicle asset registry.
            return vehicleAssetRegistry.update(userObj);
          })
          .catch(function (error) {
            // Add optional error handling here.
            throw new Error(error);

          });
      } else {
        throw new Error('Userid and Password do not match');
      }
    })
    .catch(function (error) {
      throw new Error(error);
    });
}

/**
 * Certificate Authority Login
 * @param {org.acme.goldchain.LoginAsCertificateAuthority} idpw - returns boolean if success
 * @transaction
 */
async function loginAsCertificateAuthority(idpw) {
  return getParticipantRegistry('org.acme.goldchain.CertificateAuthority')
    .then(function (participantRegistry) {
      return participantRegistry.get(idpw.userId);
    })
    .then(function (userObj) {
      if (userObj.password === idpw.password) {
        // throw new Error('login success');
        return true;
      } else {
        throw new Error('Userid and Password do not match');
      }
    })
    .catch(function (error) {
      throw new Error(error);
    });
}

/**
 * CA Convert to deed when selling
 * @param {org.acme.goldchain.CAconvertToDeed} param
 * @transaction
 */
async function caConvertToDeed(param) {
  let gold = param.gold;
  let newDeedId = param.newDeedId;
  let newGoldWeight = param.goldWeight;

  //TODO if gold weight < sum of all the deeds of this goldweight CONTINUE else error
  //Create new deed
  let factory = getFactory();
  let registry = await getAssetRegistry("org.acme.goldchain.Deed");
  let resource = factory.newResource("org.acme.goldchain", "Deed", newDeedId);
  resource.listingState = param.listingState
  resource.title = param.title;
  resource.price = param.price;
  resource.description = param.description;
  resource.gold = gold;
  resource.goldWeight = newGoldWeight;
  resource.currentOwner = param.currentOwner;
  await registry.add(resource);
}

/**
 * User claims gold based on the deed
 * @param {org.acme.goldchain.UserClaimGold} claimGold
 * @transaction
 */
async function userClaimGold(claimGold) {
  let deed = claimGold.deed;
  let weight = claimGold.goldWeight;
  if (claimGold.user.userId !== claimGold.deed.currentOwner.userId) {
    throw new Error('You are not the owner of this deed!');
  }

  // if gold is not from our miners' mine, then the weight to claim
  // is the weight shown on the deed (claim the whole thing)
  let claimAsWhole = 0;
  if (deed.gold.miner === undefined) {
    weight = deed.goldWeight;
    claimAsWhole = 1;
  }

  // if weight entered is more than the weight stated on the deed
  if (weight > deed.goldWeight) {
    weight = deed.goldWeight;
    claimAsWhole = 1;
  }

  //do minus
  let deedGoldWeight = deed.goldWeight;
  deedGoldWeight -= weight;
  let goldGoldWeight = deed.gold.goldWeight;
  goldGoldWeight -= weight;
  claimGold.deed.goldWeight = deedGoldWeight;
  claimGold.deed.gold.goldWeight = goldGoldWeight;

  // if the whole deed is claimed, remove the deed from the user array
  if (claimAsWhole == 1) {
    let i;
    for (i=0; i < claimGold.user.deedOwned.length; i++) {
      if (claimGold.user.deedOwned[i].deedId === deed.deedId) {
        claimGold.user.deedOwned.splice(i, 1);                    // remove the deed from claimer
      }
    }
    /*let j;
    for (j=0; j < claimGold.user.goldOwned.length; j++) {
      if (claimGold.user.goldOwned[j].goldId === deed.gold.goldId) {
        claimGold.user.goldOwned.splice(j, 1);                    // remove the gold from seller
      }
    }*/
    if(!claimGold.user.goldOwned){
      claimGold.user.goldOwned=[];//Init array
    }
    claimGold.user.goldOwned.push(claimGold.deed.gold);
    claimGold.deed.listingState = "CLAIMED";
  } else {
    var factory = await getFactory();
    //throw new Error('here');
    var newGold = factory.newResource("org.acme.goldchain", "Gold", claimGold.newGoldId);
    newGold.goldWeight = weight;
    newGold.goldPurity = deed.gold.goldPurity;
    newGold.verifiedBy = deed.gold.verifiedBy;
    newGold.miner = deed.gold.miner;
    let assetRegistry = await getAssetRegistry('org.acme.goldchain.Gold');
    await assetRegistry.add(newGold);
    if(!claimGold.user.goldOwned){
      claimGold.user.goldOwned=[];//Init array
    }
    claimGold.user.goldOwned.push(newGold);
  }

  if (claimGold.deed.goldWeight === 0) {
    claimGold.deed.listingState = "CLAIMED";
  }

  const deedRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  await deedRegistry.update(claimGold.deed);

  const goldRegistry = await getAssetRegistry('org.acme.goldchain.Gold');
  await goldRegistry.update(claimGold.deed.gold);

  const userRegistry = await getParticipantRegistry('org.acme.goldchain.RegisteredUser');
  await userRegistry.update(claimGold.user);
}

/**
 * Certificate Authority update user Gold Verfication Request
 * @param {org.acme.goldchain.CAUpdateUserVerificationRequest} args
 * @transaction
 */
async function caUpdateUserGoldVerificationRequest(newRequest) {
  let registeredUserRegistry = await getParticipantRegistry('org.acme.goldchain.RegisteredUser');
  let certificateAuthorityRegistry = await getParticipantRegistry('org.acme.goldchain.CertificateAuthority');
  let verificationState = newRequest.verificationState;
  let userId = newRequest.userId.userId;
  let caId = newRequest.caId.userId;
  let userExists = await registeredUserRegistry.exists(userId);
  let caExists = await certificateAuthorityRegistry.exists(caId);
  if (!userExists) {
    throw new Error("Registered User ID " + userId + " not found");
  }
  if (!caExists) {
    throw new Error("Certificate Authority ID " + caId + " not found");
  }
}

/**
 * Certificate Authority update user Deed Redemption Request
 * @param {org.acme.goldchain.CAUpdateUserDeedRedemptionRequest} args
 * @transaction
 */
async function caUpdateUserDeedRedemptionRequest(newRequest) {
  let registeredUserRegistry = await getParticipantRegistry('org.acme.goldchain.RegisteredUser');
  let certificateAuthorityRegistry = await getParticipantRegistry('org.acme.goldchain.CertificateAuthority');
  let deedRegistry = await getAssetRegistry('org.acme.goldchain.Deed');
  let verificationState = newRequest.verificationState;
  let userId = newRequest.userId.userId;
  let caId = newRequest.caId.userId;
  let deedId = newRequest.deedId.deedId;
  let userExists = await registeredUserRegistry.exists(userId);
  let caExists = await certificateAuthorityRegistry.exists(caId);
  let deedExists = await deedRegistry.exists(deedId);
  if (!deedExists) {
    throw new Error("Deed ID " + deedId + " not found");
  }
  if (!userExists) {
    throw new Error("Registered User ID " + userId + " not found");
  }
  if (!caExists) {
    throw new Error("Certificate Authority ID " + caId + " not found");
  }
}

/**
 * Certificate Authority update miner Gold Sale Request
 * @param {org.acme.goldchain.CAUpdateMinerGoldSaleRequest} args
 * @transaction
 */
async function caUpdateMinerGoldSaleRequest(newRequest) {
  let minerRegistry = await getParticipantRegistry('org.acme.goldchain.Miner');
  let certificateAuthorityRegistry = await getParticipantRegistry('org.acme.goldchain.CertificateAuthority');
  let verificationState = newRequest.verificationState;
  let minerId = newRequest.minerId.userId;
  let caId = newRequest.caId.userId;
  let minerExists = await minerRegistry.exists(minerId);
  let caExists = await certificateAuthorityRegistry.exists(caId);
  if (!minerExists) {
    throw new Error("Miner ID " + minerId + " not found");
  }
  if (!caExists) {
    throw new Error("Certificate Authority ID " + caId + " not found");
  }
}

// ************************

/*
Difference between goldSale, confirmGold, createDeed?
ListOfOffers returns listOfOffers. ConfrimGold returns deed created. See Lab3pg25
*/