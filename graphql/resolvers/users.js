const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ForbiddenError, UserInputError } = require("apollo-server-express");
const dotenv = require("dotenv");
dotenv.config();

const { User, SecreteCode } = require("../../models/index.js");
const {
  validators: { validateLoginInput, validateRegisterInput },
  sendEmail,
} = require("../../utils/index.js");

async function generateToken(sub, payload) {
  return await jwt.sign(payload, process.env.TOKEN_SECRET_KEY, {
    algorithm: "HS256",
    subject: sub,
    expiresIn: "2d",
  });
}

const userResolvers = {
  Mutation: {
    async login(_, { studentNumber, password }, { req }) {
      const { errors, valid } = validateLoginInput(studentNumber, password);

      // Check for any input errors after validating them
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      // Find the user from database
      const user = await User.findOne({ studentNumber });

      // If user is null then no user is found then return user not found
      if (!user) {
        errors.general = "User not found";
        throw new UserInputError("User not found", { errors });
      }

      // Match passwords and throw user input errors if they're wrong
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        errors.general = "Wrong Credentials";
        throw new UserInputError("Wrong Credentials", { errors });
      }

      // Getting all the contacts fo the user if there are any
      let contacts = await User.find({ _id: { $in: user.contacts } });

      // Generate the JWT token for user's authetication
      // Create JWT payload section here mate
      const jwtPayload = {
        roles: "user",
        permissions: [
          "read:public_content",
          "read:own_content",
          "write:own_content",
        ],
      };
      const token = generateToken(user.id, jwtPayload);

      // Return the final result
      return {
        ...user._doc,
        id: user.id,
        contacts: contacts,
        token,
      };
    },

    //Registering a user
    async register(
      _,
      {
        registerInput: {
          studentNumber,
          firstName,
          lastName,
          email,
          picture,
          degree,
          bio,
          password,
          confirmPassword,
        },
      }
    ) {
      // 1. Validate user input
      const { valid, errors } = validateRegisterInput(
        studentNumber,
        firstName,
        lastName,
        email,
        password,
        confirmPassword
      );

      // Throw errors if there is an error in the inputs
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      // Make sure user doesn't already exist
      const user = await User.findOne({ studentNumber });
      if (user) {
        throw new UserInputError("Student number is taken", {
          errors: {
            studentNumber:
              "This student number is registered, try to loggin with",
          },
        });
      }

      // hash password and create user password
      password = await bcrypt.hash(password, 12);

      // Create the mongo object with User schema
      const newUser = new User({
        studentNumber,
        firstName,
        lastName,
        email,
        picture: picture && picture.replace(/ /gi, "") ? picture : "",
        degree: degree && degree.replace(/ /gi, "") ? degree : "",
        bio: bio && bio.replace(/ /gi, "") ? bio : "",
        password,
      });

      // Save user to database
      const res = await newUser.save();

      // Generate the JWT token for the user's authentication
      const jwtPayload = {
        roles: "user",
        permissions: [
          "read:related_content",
          "read:own_content",
          "write:own_content",
        ],
      };
      const token = generateToken(res._id, jwtPayload);

      // Return all the info back to the client
      const _user = {
        ...res._doc,
        id: res._id,
        token,
      };
      _user.contacts = [];

      let secreteCode = jwt.sign(
        {
          firstName: _user.firstName,
          lastName: _user.lastName,
          email: _user.email,
        },
        SECRET_KEY,
        { expiresIn: "12h" }
      );
      await new SecreteCode({
        email: _user.email,
        code: secreteCode,
      }).save();

      sendEmail("ACCOUNT_VERIFICATION", {
        firstName: _user.firstName,
        lastName: _user.lastName,
        email: _user.email,
        verificationLink: `https://${process.env.SERVER_URL}/auth/verification/verify-email/${_user.id}/${secreteCode}`,
      });

      return _user;
    },
    async updateUser(_, { updateInput }, { req }) {
      // Check if user has priviledges for editing the account
      if (!req.user) {
        throw new ForbiddenError("Not Authorized", {
          error: "not_auth",
        });
      }

      // Create new user object from database
      // In SQL
      // SELECT * FROM User WHERE id = <user.id>
      const updatedUser = await User.findById(req.user.sub);

      // TODO: Come back and here work out the update user with and without the password
      // Check if passwords match before doing anything

      // strip password, confirmNewPassword, newPassword off of the updateInput
      // save the rest to newUserData
      const { password, confirmNewPassword, newPassword, ...newUserData } =
        updateInput;

      // If user wishes to change the password then this is the code for that
      // Check if updateInput.newPassword === update.confirmNewPassword
      // Hash the passwords and map them to newUserData variable.
      if (password && newPassword === confirmNewPassword) {
        const match = await bcrypt.compare(password, updatedUser.password);

        // Throw user input error if passwords do not match
        if (!match) {
          throw new UserInputError("Wrong credentials", {
            errors: {
              password: "Wrong password.",
            },
          });
        }

        const newHashPassword = await bcrypt.hash(newPassword, 12);
        newUserData.password = newHashPassword;
      }

      // Save the data to updatedUser
      Object.keys(newUserData).forEach((key) => {
        if (newUserData[key]) {
          updatedUser[key] = newUserData[key];
        }
      });

      // Save updatedUser to the database
      const res = await updatedUser.save();

      // Generate the new token with new user data
      const token = generateToken(res);

      // Return the whole info to the client
      return {
        ...res._doc,
        id: res._id,
        token,
      };
    },
  },
  Query: {
    async getUserData(_, { id }) {
      // Given the student number, find the user data and return minimal data
      try {
        // In SQL
        // SELECT id, firstName, lastName, studentNumber, picture
        //    FROM User WHERE id = <id>;
        const user = await User.findById(id, {
          firstName: 1,
          lastName: 1,
          studentNumber: 1,
          picture: 1,
        });

        // Return the user to client
        return user;
      } catch (err) {
        throw new Error("No user found");
      }
    },
  },
};

module.exports = userResolvers;
