import { Schema, model } from 'mongoose';

const oauthProviderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  provider: {
    type: String,
    enum: ['google', 'facebook', 'github'],
    required: true,
  },
  providerId: {
    type: String,
    required: true,
    index: true,
  },
  providerData: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Compound index for faster lookups
oauthProviderSchema.index({ provider: 1, providerId: 1 });
oauthProviderSchema.index({ userId: 1, provider: 1 }, { unique: true });

const OAuthProvider = model('OAuthProvider', oauthProviderSchema);

export default OAuthProvider;