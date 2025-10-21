import validator from "validator";

/**
 * Valida el formato del email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido, false si no
 */
export const isValidEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Valida que la contraseña cumpla con los requisitos:
 * - Al menos 8 caracteres
 * - Al menos una mayúscula
 * - Al menos un número
 * - Al menos un símbolo
 * @param {string} password - Contraseña a validar
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una mayúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("La contraseña debe contener al menos un número");
  }

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\\/;'`~]/.test(password)) {
    errors.push("La contraseña debe contener al menos un símbolo");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
