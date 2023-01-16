const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");
const { ForbiddenError, UserInputError } = require("apollo-server-express");
const isTokenValid = require("../../utils/validateToken.js");
require("dotenv").config();

const {
  User,
  SecreteCode,
  Message,
  Password,
} = require("../../models/index.js");
const {
  validators: { validateLoginInput, validateRegisterInput },
  sendEmail,
  getRandomPassword,
} = require("../../utils/index.js");

async function generateToken(sub, payload) {
  return await jwt.sign(payload, process.env.TOKEN_SECRET_KEY, {
    algorithm: "HS256",
    subject: String(sub),
    expiresIn: "2d",
  });
}

const userResolvers = {
  Mutation: {
    async login(_, { email, password = "what" }, { req }) {
      // Check if user has priviledges for editing the account
      const { error } = isTokenValid(req.headers.authorization.split(" ")[1]);
      if (error) {
        console.log(error);
        throw new ForbiddenError("Not Authorized", {
          errors: "not_auth",
        });
      }

      email = email.trim();
      password = password.trim();
      const { errors, valid } = validateLoginInput(email, password);

      // Check for any input errors after validating them
      if (!valid) {
        throw new UserInputError("Errors", {
          error: "email_password_incorrect",
        });
      }

      // Find the user from database
      const user = await User.findOne({ email });

      // If user is null then no user is found then return user not found
      if (!user) {
        errors.general = "User not found";
        throw new UserInputError("User not found", { error: "invalid_email" });
      }

      // Getting all the contacts fo the user if there are any
      let contacts = await User.find({ _id: { $in: user.contacts } });

      // Return the final result
      return {
        ...user._doc,
        id: user.id,
        contacts: contacts,
      };
    },

    //Registering a user
    async register(
      _,
      {
        registerInput: {
          firstName,
          lastName,
          email,
          picture,
          degree,
          university,
          campus,
          gender,
        },
      },
      { req }
    ) {
      // Check if user has priviledges for editing the account
      const { error } = isTokenValid(req.headers.authorization.split(" ")[1]);
      if (error) {
        console.log(error);
        throw new ForbiddenError("Not Authorized", {
          errors: "not_auth",
        });
      }

      console.log("Registering a user");

      // 1. Validate user input
      const { valid, errors } = validateRegisterInput(
        firstName,
        lastName,
        email
      );

      // Throw errors if there is an error in the inputs
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      // Make sure user doesn't already exist
      const user = await User.findOne({ email });
      if (user) {
        throw new UserInputError("Email address is taken", {
          errors: "email_exists",
        });
      }

      // let csEmail = "nucelarsoftwarehosting@gmail.com";
      // const csRes = await User.findById("62162fa57faa3f001601f247");

      // console.log(csRes);

      // Create the mongo object with User schema
      const newUser = new User({
        firstName,
        lastName,
        email,
        picture: picture && picture.replace(/ /gi, "") ? picture : "",
        degree: degree && degree.replace(/ /gi, "") ? degree : "",
        university:
          university && university.replace(/ /gi, "") ? university : "",
        campus: campus && campus.replace(/ /gi, "") ? campus : "",
        gender: gender && gender.replace(/ /gi, "") ? gender : "",
        contacts: ["62162fa57faa3f001601f247"],
      });

      // Save user to database
      const res = await newUser.save();

      // Return all the info back to the client
      const _user = {
        ...res._doc,
        id: res._id,
      };

      _user.contacts = [
        {
          id: "62162fa57faa3f001601f247",
          firstName: "Customer",
          lastName: "Service",
          email: "nucelarsoftwarehosting@gmail.com",
          picture:
            "https://firebasestorage.googleapis.com/v0/b/qampus-app.appspot.com/o/62162fa57faa3f001601f247%2Fprofile%2FCustomer.jpg?alt=media&token=c5d384a7-7d8b-4896-b547-a6da7793cee0",
        },
      ];

      let secreteCode = jwt.sign(
        {
          firstName: _user.firstName,
          lastName: _user.lastName,
          email: _user.email,
        },
        process.env.TOKEN_SECRET_KEY,
        { expiresIn: "12h" }
      );

      const msgObject = {
        to: _user.id,
        from: "62162fa57faa3f001601f247",
        time: dayjs().toISOString(),
        attachment: "",
        textMsg:
          "Welcome to Qampus, If you need any help please feel free to chat with us here.",
      };

      const message = new Message(msgObject);
      await message.save();

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
      const { error } = isTokenValid(req.headers.authorization.split(" ")[1]);
      if (error) {
        console.log(error);
        throw new ForbiddenError("Not Authorized", {
          errors: "not_auth",
        });
      }

      // Create new user object from database
      // In SQL
      // SELECT * FROM User WHERE id = <user.id>
      const updatedUser = await User.findById(updateInput.id);

      // Save the data to updatedUser
      Object.keys(updateInput).forEach((key) => {
        if (updateInput[key] || key === "picture") {
          updatedUser[key] = updateInput[key];
        }
      });

      // Save updatedUser to the database
      const res = await updatedUser.save();

      // Generate the new token with new user data

      let contacts = await User.find({ _id: { $in: res.contacts } });

      let newUser = {
        ...res._doc,
        id: res._id,
        contacts: contacts || [],
      };

      // Return the whole info to the client
      return newUser;
    },

    async forgotPassword(_, { email }) {
      try {
        let user = await User.findOne({ email });

        let password = getRandomPassword();
        passwordHash = await bcrypt.hash(password, 12);

        let passwordModel = await Password.findOne({ owner: email });

        if (!passwordModel) {
          passwordModel = new Password({
            owner: user.email,
            current: user.password,
            secure: passwordHash,
          });
        } else {
          passwordModel.current = user.password;
          passwordModel.secure = passwordHash;
          passwordModel.secureUsed = false;
          passwordModel.resetRequest = true;
        }

        passwordModel.save();

        sendEmail("FORGOT_PASSWORD", {
          password,
          email,
        });

        user.password = passwordHash;
        user.save();

        return "Secure password created";
      } catch (err) {
        throw new Error("Error eccured please try again.");
      }
    },

    async deleteContact(_, { contactId, userId }, { req }) {
      const { error } = isTokenValid(req.headers.authorization.split(" ")[1]);
      if (error) {
        console.log(error);
        throw new ForbiddenError("Not Authorized", {
          errors: "not_auth",
        });
      }

      try {
        let user = await User.findById(userId);

        user.contacts = user.contacts.filter((contact) => {
          return contact != contactId;
        });

        await user.save();

        return "Contact deleted";
      } catch (err) {
        throw new Error("Server error");
      }
    },

    async blockContact(_, { contactId, userId }, { req }) {
      const { error } = isTokenValid(req.headers.authorization.split(" ")[1]);
      if (error) {
        console.log(error);
        throw new ForbiddenError("Not Authorized", {
          errors: "not_auth",
        });
      }

      try {
        let user = await User.findById(userId);

        if (user?.blockedContacts) {
          // if (user.blockedContacts.includes(contactId)) {
          //   throw new Error("Contact already blocked");
          // }

          user.blockedContacts.push(contactId);
        } else {
          user.blockedContacts = [contactId];
        }

        await user.save();

        return "Contact blocked";
      } catch (err) {
        throw new Error("Server error");
      }
    },

    async unblockContact(_, { contactId, userId }, { req }) {
      const { error } = isTokenValid(req.headers.authorization.split(" ")[1]);
      if (error) {
        console.log(error);
        throw new ForbiddenError("Not Authorized", {
          errors: "not_auth",
        });
      }

      try {
        let user = await User.findById(userId);

        user.blockedContacts = user.blockedContacts.filter((contact) => {
          return contact != contactId;
        });

        await user.save();

        return "Contact unblocked";
      } catch (err) {
        throw new Error("Server error");
      }
    },
  },
  Query: {
    async getUserData(_, { id }) {
      // Given the student number, find the user data and return minimal data
      try {
        // In SQL
        // SELECT id, firstName, lastName, email, picture
        //    FROM User WHERE id = <id>;
        const user = await User.findById(id);

        // Return the user to client
        return user;
      } catch (err) {
        console.log(err);
        throw new Error("No user found");
      }
    },
  },
};

module.exports = userResolvers;
