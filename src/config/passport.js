// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:1000/api/auth/google/callback',
      scope: ['profile', 'email'],
      prompt: 'select_account',
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log('Google profile:', profile); // 👈 Thêm dòng này để debug

      try {
        const user = {
          authProvider: 'google',
          googleId: profile.id,
          fullname: profile.displayName,
          email: profile.emails?.[0].value, // 👈 Có thể null nếu thiếu scope
          avatar: profile.photos?.[0].value,
        };
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

module.exports = passport;
