const validateRegisterInput = (
  firstName,
  lastName,
  email,
  password,
  confirmPassword
) => {
  const errors = {};

  if (firstName.trim() === "" || lastName.trim() === "") {
    errors.username = "Name or surname must not be empty";
  }

  if (email.trim() === "") {
    errors.email = "Email must not be empty";
  } else {
    const regEx =
      /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
    if (!email.match(regEx)) {
      errors.email = "Email must be a valid email address";
    }
  }

  if (password === "") {
    errors.password = "Password must not be empty";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords must match";
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};

const validateLoginInput = (email, password) => {
  const errors = {};

  const regEx =
    /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
  if (!email.match(regEx)) {
    errors.email = "Email must be a valid email address";
  }

  if (password.trim() === "") {
    errors.password = "Password must not be empty";
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};

const validateBookInput = ({ isbn, title, authors, price }) => {
  const errors = {};

  if (isbn.trim() === "") {
    errors.isbn = "The book isbn cannot be empty";
  }

  if (title.trim() === "") {
    errors.title = "The book title cannot be empty";
  }

  if (authors.trim() === "") {
    errors.authors = "The author cannot be empty";
  }

  if (price.toString().trim() === "") {
    errors.price = "The book price cannot be empty";
  } else if (!+price) {
    errors.price = "The book price has to be a valid number";
  }

  return { errors, valid: Object.keys(errors).length < 1 };
};

const validateUpdateInput = ({ password, newPassword, confirmNewPassword }) => {
  const errors = {};

  if (password.trim() === "") {
    errors.password = "Password cannot be empty";
  }

  if (newPassword && newPassword.trim() === "") {
    errors.newPassword = "Your new passwords cannot be empty";
  } else if (confirmNewPassword && confirmNewPassword.trim() === "") {
    errors.newPassword = "Your new passwords cannot be empty";
  } else if (newPassword !== confirmNewPassword) {
    errors.newPassword = "Your new passwords need to match";
  }

  return { errors, valid: Object.keys(errors).length < 1 };
};

module.exports = {
  validateLoginInput,
  validateRegisterInput,
  validateBookInput,
  validateUpdateInput,
};
