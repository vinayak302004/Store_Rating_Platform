export function validateUserInput(data, { passwordRequired = true } = {}) {
  const { name, email, address, password } = data;

  if (name !== undefined && (name.trim().length < 20 || name.trim().length > 60)) {
    return "Name must be between 20 and 60 characters";
  }

  if (address !== undefined && address.trim().length > 400) {
    return "Address must be at most 400 characters";
  }

  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Invalid email address";
  }

  if (passwordRequired && password === undefined) {
    return "Password is required";
  }

  if (password !== undefined &&
      (password.length < 8 ||
       password.length > 16 ||
       !/[A-Z]/.test(password) ||
       !/[^A-Za-z0-9]/.test(password))) {
    return "Password must be 8-16 characters and contain at least one uppercase letter and one special character";
  }

  return null;
}

export function validateRating(rating) {
  const n = Number(rating);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
}
