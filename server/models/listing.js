import mongoose from "mongoose";

const ListingSchema = new mongoose.Schema({
  listingId: {
    type: String,
    required: true,
  },
  photoDirs: {
    type: [String],
    required: false,
  },
});

ListingSchema.statis.findByListingId = async (listingId) => {

};

const Listing = mongoose.model('Listing', ListingSchema);

module.exports = {
  Listing
};