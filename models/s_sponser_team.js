/** @format */

const Schema = require("mongoose").Schema;
const mongoose = require("mongoose");

const SponsorCommissionSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "Users" },
    sponsor_id: { type: String },
    doj: { type: String },
    user_name: { type: String },
    email_id: { type: String },
    registerId: { type: String },
    sponsor_name: { type: String },
  },
  { timestamps: true },
);

const SponsorId = mongoose.model("SponsorId", SponsorCommissionSchema);
module.exports = {
  SponsorId: SponsorId,
};
