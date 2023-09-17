const Schema = require('mongoose').Schema;
const mongoose = require('mongoose');

const CommissionSchema = new Schema({
  categoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
  subCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
  childCategoryId: { type: Schema.Types.ObjectId, ref: 'categories' },
  commission: { type: Number },
  price: {
    from: { type: Number, default: 0 },
    to: { type: Number, default: 0 }
  },
  status: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Commissions = mongoose.model('commissions', CommissionSchema);
module.exports = { Commissions: Commissions, }

