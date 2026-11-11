/**
 * Client-side validation utilities matching server-side validation contracts
 */

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@ves\.ac\.in$/;

export const validateEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Institutional email is required.';
  }
  const clean = email.trim().toLowerCase();
  if (!clean.endsWith('@ves.ac.in')) {
    return 'Only official @ves.ac.in email addresses are permitted.';
  }
  if (!EMAIL_REGEX.test(clean)) {
    return 'Please enter a valid @ves.ac.in email address.';
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return null;
};

export const validatePrice = (price, fieldName = 'Price') => {
  const num = Number(price);
  if (price === '' || price === null || price === undefined || Number.isNaN(num)) {
    return `${fieldName} is required.`;
  }
  if (num <= 0) {
    return `${fieldName} must be greater than ₹0.`;
  }
  return null;
};

export const validateTitle = (title) => {
  if (!title || !title.trim()) {
    return 'Title is required.';
  }
  const len = title.trim().length;
  if (len < 3) {
    return 'Title must be at least 3 characters.';
  }
  if (len > 120) {
    return 'Title cannot exceed 120 characters.';
  }
  return null;
};

export const validateRequired = (val, fieldName = 'Field') => {
  if (!val || !val.toString().trim()) {
    return `${fieldName} is required.`;
  }
  return null;
};
