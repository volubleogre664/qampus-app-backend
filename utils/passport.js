import passport from "passport";
import { GraphQLLocalStrategy } from "graphql-passport";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const loginUser = async (username, password, done) => {
  try {
    const user = await User.findOne({ studentNumber: username });

    // If user is null then no user is found then return user not found
    if (!user) {
      return done(null, false);
    }

    // Match passwords and throw user input errors if they're wrong
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return done(null, false);
    }

    // If all is well return the user and the contacts
    return done(null, user);
  } catch (error) {
    done(error);
  }
};

const localStrategy = new GraphQLLocalStrategy(loginUser);

passport.use(localStrategy);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (userId, done) => {
  try {
    const user = await User.findById(userId);

    done((null, user));
  } catch (error) {
    done(error);
  }
});
