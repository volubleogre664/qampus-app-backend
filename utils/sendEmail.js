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

function sendEmail(type, data) {
  const fileTemplates = {
    BOOK_SALE: "/emails/bookBought.ejs",
    ACCOUNT_VERIFICATION: "/emails/verifyAccount.ejs",
  };

  const { seller, buyer, book } = data;

  const emailOptions = {
    to: seller?.email || data.email,
    from: book
      ? `Qampus <noreply@qampus.com>`
      : "Qampus Account Verification <noreply@qampus.com>",
    subject: book
      ? `${buyer.firstName} wants your book - ${book.title}`
      : "Verify your email address",
  };

  ejs.renderFile(
    path.resolve("./") + fileTemplates[type],
    book ? { seller, buyer, book } : { user: data },
    function (err, htmlData) {
      if (err) console.log("Error sending email", err);
      else {
        transport
          .sendMail({
            ...emailOptions,
            html: htmlData,
          })
          .then(() => console.log("Email sent"))
          .catch((err) => console.log("Error sending email", err));
      }
    }
  );
}

// sendEmail("ACCOUNT_VERIFICATION", {
//   firstName: "Jabu",
//   lastName: "Zungu",
//   email: "nduduzos820@gmail.com",
//   verificationLink:
//     "https://server.qampus.co.za/auth/verification/verify-email/6114eccb37b700001a849fde/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdE5hbWUiOiJKYWJ1IiwibGFzdE5hbWUiOiJadW5ndSIsImVtYWlsIjoibmR1ZHV6b3M4MjBAZ21haWwuY29tIiwiaWF0IjoxNjI4NzYxMjkxLCJleHAiOjE2Mjg4MDQ0OTF9.eEeusQxQFaQNrLC_RYgRuvo5ntsrkttB5u1Nf9fMevE",
// });

module.exports = sendEmail;
