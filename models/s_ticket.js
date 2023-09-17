/** @format */

const Schema = require("mongoose").Schema;
const mongoose = require("mongoose");

const TicketSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Users" },
    adminId: { type: Schema.Types.ObjectId, ref: "Admin" },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller" },
    subjectId: { type: Schema.Types.ObjectId, ref: "ticketCategories" },
    message: { type: String },
    role: { type: String, enum: ["user", "admin", "seller"] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const TicketListSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "Users" },
    ticketNo: { type: String },
    subjectId: { type: Schema.Types.ObjectId, ref: "ticketCategories" },
    message: { type: String },
    chat: { type: String },
    status: { type: String },
  },
  { timestamps: true },
);

const Tickets = mongoose.model("supportTickets", TicketSchema);
const TicketsList = mongoose.model("TicketsList", TicketListSchema);
module.exports = {
  Tickets: Tickets,
  TicketsList: TicketsList,
};
