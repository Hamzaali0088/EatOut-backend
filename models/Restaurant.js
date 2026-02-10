const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ['ESSENTIAL', 'PROFESSIONAL', 'ENTERPRISE'],
      default: 'ESSENTIAL',
    },
    status: {
      type: String,
      enum: ['TRIAL', 'ACTIVE', 'SUSPENDED'],
      default: 'TRIAL',
    },
    trialEndsAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
  },
  { _id: false }
);

const websiteSettingsSchema = new mongoose.Schema(
  {
    subdomain: {
      // e.g. myrestaurant => myrestaurant.yourdomain.com
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    bannerUrl: {
      type: String,
    },
    description: {
      type: String,
    },
    contactPhone: {
      type: String,
    },
    contactEmail: {
      type: String,
    },
    address: {
      type: String,
    },
  },
  { _id: false }
);

const restaurantSchema = new mongoose.Schema(
  {
    website: websiteSettingsSchema,
    subscription: subscriptionSchema,
    settings: {
      // POS / inventory behaviour that may be configurable later
      allowOrderWhenOutOfStock: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;

