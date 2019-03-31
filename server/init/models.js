namespace org.acme.goldchain
// ****** Participants ******
// Certificate Authority approve/reject miner gold sale request
transaction CAGoldSaleRequest {
  --> Gold gold
  --> Miner minerId
  o Double goldWeight
  o Double goldPurity optional
  o VerificationState verificationState
  //o VerificationState verificationState
}

// Miner sell gold to CA
transaction MinerSellGoldToCA {
  -->Gold oldGold
  o String newGoldId
  o Double newGoldWeight
  o Double newGoldPurity optional
  --> Miner miner
  --> CertificateAuthority ca
}


// Miner creates gold for themselves
transaction MinerCreateGold {
  o String goldId
  o Double goldWeight
  o Double goldPurity
  --> Miner miner
  // --> CertificateAuthority ca
}

abstract participant User identified by userId {
  o String userId
  o String email
  o String name
  o String password
  o Double cash default = 0.0
  o Status status
  --> Gold[] goldOwned optional
  --> Deed[] deedOwned optional
}

enum Status {
  o PENDING_APPROVAL
  o ACTIVE
  o DEACTIVATED
}

// RegisteredUser (Buyer/Seller)
participant RegisteredUser extends User {
}

// Miner (Gold Origin)
participant Miner extends User {
}

// Certificate Authority (Bank)
participant CertificateAuthority extends User {
}

// ************************

// ****** Gold Asset ******

asset Gold identified by goldId {
  o String goldId
  o Double goldWeight
  o Double goldPurity
  o String[] photoDirs optional
  --> CertificateAuthority verifiedBy optional
  --> Miner miner optional
}

// Create new Gold Asset
transaction CreateGold {
  o String goldId
  o Double goldWeight
  o Double goldPurity
  o String caId
  o String minerId optional
  o String[] photoDirs optional
}

// Read all Gold Assets
transaction GetAllGold{
}

// Read Gold Asset by ID
transaction GetGoldById{
  o String goldId
}

// Update existing Gold Asset
transaction UpdateGold{
  o String goldId
  o Double goldWeight
  o Double goldPurity
  o String[] photoDirs optional
  --> CertificateAuthority ca
  --> Miner miner optional
}

// Delete Gold by ID
transaction DeleteGoldById {
  o String goldId
}

/* ======= use userclaimgold under ca instead =====
// Gold claiming
transaction goldClaim {
  o String deedId
}*/

// ************************

// ****** Deed Asset ******

asset Deed identified by deedId {
  o String deedId
  o Double goldWeight
  o Double weightListed optional
  //o Double purity
  o Offer[] offers optional
  o ListingState listingState
  o String title optional
  o Double price optional
  o String description optional
  o String[] photoDirs optional
  --> User currentOwner
  --> Gold gold
}

transaction Delist {
  --> Deed deed
}

// Create new Deed Asset
transaction CreateDeed {
  o String deedId
  o Double goldWeight
  o Offer[] offers optional
  o ListingState listingState
  o String title optional
  o Double price optional
  o String description optional
  //o String userId
  //o String goldId
  o String[] photoDirs optional
  --> RegisteredUser user
  --> Gold gold
}
// Create new Deed Asset for CA
transaction CreateDeedCa {
  o String deedId
  o Double goldWeight
  o Offer[] offers optional
  o ListingState listingState
  o String title optional
  o Double price optional
  o String description optional
  //o String userId
  //o String goldId
  o String[] photoDirs optional
  --> CertificateAuthority user
  --> Gold gold
}

// Read all Deed Assets
transaction GetAllDeed {
}

// Read Deed Asset by ID
transaction GetDeedById{
  o String deedId
}

// Update existing Deed Asset
transaction UpdateDeed{
  o String deedId
  o Double goldWeight
  o Offer[] offers optional
  o ListingState listingState
  o String[] photoDirs optional
  --> User userId
  --> Gold goldId
}

// Delete Deed by ID
transaction DeleteDeedById {
  o String deedId
}

// ************************

// ****** Registered User ******

// Registered User Login
transaction LoginAsRegisteredUser {
  o String userId
  o String password
}

// Update Registered User
transaction UpdateRegisteredUser {
  o String email
  o String name
  o String password
  o String oldUserId
  o String oldPassword
}

// Registered User convert to deed
transaction UserConvertToDeed {
}

// Registered User list deed for auction
transaction ListDeedForAuction {
  --> Deed deedId
  o Double weightToList
  o String title
  o Double price
  o String description
  // --> User sellerId
}

// Registered User list deed for 1 to 1 sale
transaction ListDeedForSale {
  --> Deed deedId
  o Double weightToList
  o String title
  o Double price
  o String description
  // --> User sellerId
}

// Buyer offer for deed on Listing
transaction Offer {
  o Double offerPrice
  --> Deed deedToBuy
  --> RegisteredUser buyerId
}

// User view list of offers
transaction ListOfOffers {
  --> Deed deedToBuy
}

// User accept offer
transaction AcceptOffer {
  --> Deed deedToBuy
  o String offerTxId
  o String newDeedId
}

// User close bidding
transaction CloseBidding {
  --> Deed deedToClose
}

// Update offer
transaction UpdateOffer {
  o Double newOfferPrice
  --> Deed deedListing
}

// User submit gold verfication request
transaction UserSubmitGoldVerificationRequest {
  --> RegisteredUser userId
  --> CertificateAuthority caId
  o VerificationState verificationState
}

// User submit deed redemption request
transaction UserSubmitDeedRedemptionRequest {
  --> Deed deedId
  --> RegisteredUser userId
  --> CertificateAuthority caId
  o VerificationState verificationState
}

// Update Cash Amount for Registered User
transaction UpdateCashRegisteredUser {
  --> RegisteredUser user
  o Double cash
}

// Listing states
enum ListingState {
  o NOT_LISTED
  o AUCTION
  o CLAIMED
  o FOR_1TO1_SALE
}

// ************************

// ****** Miner ******

// Miner Login
transaction LoginAsMiner {
  o String userId
  o String password
}

// Update Miner
transaction UpdateMiner {
  o String email
  o String name
  o String password
  o String oldUserId
  o String oldPassword
}



// Miner submit gold sale request
transaction MinerSubmitGoldSaleRequest {
  --> Miner minerId
  --> CertificateAuthority caId
  o VerificationState verificationState
}

// ************************

// ****** Certificate Authority ******

// Certificate Authority Login
transaction LoginAsCertificateAuthority {
  o String userId
  o String password
}

// Update Certificate Authority
transaction UpdateCertificateAuthority {
  o String email
  o String name
  o String password
  o String oldUserId
  o String oldPassword
}

// User claim gold
transaction UserClaimGold {
  o Double goldWeight
  --> RegisteredUser user
  --> Deed deed
  o String newGoldId
  //from our mine: can put goldweight, partial claim
  //else usersubmit: goldweight==gold.goldweight
}

// Certificate Authority convert to deed
transaction CAconvertToDeed {
  --> Gold gold
  o String newDeedId
  o Double goldWeight
  --> RegisteredUser currentOwner
  o ListingState listingState
  o String title
  o Double price
  o String description optional
}

// Certificate Authority approve/reject user verification request
transaction CAUpdateUserVerificationRequest {
  --> RegisteredUser userId
  --> CertificateAuthority caId
  o VerificationState verificationState
}

// Certificate Authority approve/reject user deed redemption request
transaction CAUpdateUserDeedRedemptionRequest {
  --> Deed deedId
  --> RegisteredUser userId
  --> CertificateAuthority caId
  o VerificationState verificationState
}

// Certificate Authority approve/reject miner gold sale request
transaction CAUpdateMinerGoldSaleRequest {
  --> Miner minerId
  --> CertificateAuthority caId
  o VerificationState verificationState
}

// Verfication state
enum VerificationState {
  o PENDING
  o APPROVED
  o REJECTED
}