const nodemailer = require("nodemailer");
const sibTransport = require("nodemailer-sendinblue-transport");
const ejs = require("ejs");
const path = require("path");

// const v3SibKey =
//   "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";

const transport = nodemailer.createTransport(
  sibTransport({
    apiKey: "0QPXT2z5G983d6Zw",
  })
);

// The ejs file templates
const fileTemplates = {
  BOOK_SALE: "/emails/bookBought.ejs",
  ACCOUNT_VERIFICATION: "/emails/verifyAccount.ejs",
  FORGOT_PASSWORD: "/emails/forgotPassword.ejs",
};

function setEmailMetaData(emailType, data) {
  const emailOptions = {};
  let html = "";

  const renderEJS = (fileTemplate, data) => {
    let html = "";

    ejs.renderFile(fileTemplate, data, function (err, htmlData) {
      if (err) console.log("Error compiling ejs data", err);

      html = htmlData;
    });

    return html;
  };

  switch (emailType) {
    case "FORGOT_PASSWORD": {
      emailOptions.to =
        data.email == "jdoe@fake.com" && "nduduzos820@gmail.com";
      emailOptions.from = "Qampus <noreply@qampus.com>";
      emailOptions.subject = `Qampus Password Request`;

      html = renderEJS(path.resolve("./") + fileTemplates[emailType], {
        password: data.password,
      });

      break;
    }

    case "BOOK_SALE": {
      const { seller, buyer, book } = data;

      emailOptions.to = data.email;
      emailOptions.from = "Qampus <noreply@qampus.com>";
      emailOptions.subject = `${buyer.firstName} wants your book - ${book.title}`;

      html = renderEJS(path.resolve("./") + fileTemplates[emailType], {
        seller,
        buyer,
        book,
      });

      break;
    }

    default: {
      // Account verification is the default
      emailOptions.to = data.email;
      emailOptions.from = "Qampus <noreply@qampus.com>";
      emailOptions.subject = "Verify your email address";

      html = renderEJS(
        path.resolve("./") + fileTemplates["ACCOUNT_VERIFICATION"],
        { user: data }
      );
    }
  }

  return { emailOptions, htmlData: html };
}

function sendEmail(type, data) {
  const { htmlData: html, emailOptions } = setEmailMetaData(type, data);

  transport
    .sendMail({
      ...emailOptions,
      html,
    })
    .then(() => console.log("Email sent"))
    .catch((err) => console.log("Error sending email", err));
}

// sendEmail("ACCOUNT_VERIFICATION", {
//   firstName: "Jabu",
//   lastName: "Zungu",
//   email: "nduduzos820@gmail.com",
//   verificationLink:
//     "https://server.qampus.co.za/auth/verification/verify-email/6114eccb37b700001a849fde/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdE5hbWUiOiJKYWJ1IiwibGFzdE5hbWUiOiJadW5ndSIsImVtYWlsIjoibmR1ZHV6b3M4MjBAZ21haWwuY29tIiwiaWF0IjoxNjI4NzYxMjkxLCJleHAiOjE2Mjg4MDQ0OTF9.eEeusQxQFaQNrLC_RYgRuvo5ntsrkttB5u1Nf9fMevE",
// });

// sendEmail("FORGOT_PASSWORD", {
//   password: "123456789",
//   email: "nduduzos820@gmail.com",
// });

module.exports = sendEmail;
