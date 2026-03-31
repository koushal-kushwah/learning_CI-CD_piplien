import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/userModel.js';
import OAuthProvider from '../models/oauthProviderModel.js';
import logger from './logger.js';
import { config } from './config.index.js';

if (process.env.NODE_ENV !== "test") {
    passport.use(new GoogleStrategy({
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/v1/auth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user exists with this Google ID
            const oauthProvider = await OAuthProvider.findOne({
                provider: 'google',
                providerId: profile.id,
            });

            if (oauthProvider) {
                // User exists, get the user
                const user = await User.findById(oauthProvider.userId);
                return done(null, user);
            }

            // Check if user exists with this email
            const email = profile.emails[0].value;
            let user = await User.findOne({ email });

            if (user) {
                // Link Google account to existing user
                await OAuthProvider.create({
                    userId: user._id,
                    provider: 'google',
                    providerId: profile.id,
                    providerData: profile._json,
                });
            } else {
                // Create new user
                user = await User.create({
                    fullName: profile.displayName,
                    email: email,
                    isEmailVerified: true,
                    profilePicture: profile.photos[0]?.value || null,
                });

                await OAuthProvider.create({
                    userId: user._id,
                    provider: 'google',
                    providerId: profile.id,
                    providerData: profile._json,
                });
            }

            return done(null, user);
        } catch (error) {
            logger.error('Google OAuth error:', error);
            return done(error, null);
        }
    }));

} // end if

export default passport;