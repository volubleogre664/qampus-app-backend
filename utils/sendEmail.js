import nodemailer from "nodemailer";
import sibTransport from "nodemailer-sendinblue-transport";
import ejs from "ejs";
import path from "path";

const transport = nodemailer.createTransport(
  sibTransport({
    apiKey: "0QPXT2z5G983d6Zw",
  })
);

function sendEmail(type, data) {
  console.log(data);
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

export default sendEmail;
