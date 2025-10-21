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

/**
 * Valida coordenadas de latitud y longitud
 * @param {number} latitude - Latitud a validar
 * @param {number} longitude - Longitud a validar
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validateCoordinates = (latitude, longitude) => {
  const errors = [];

  if (typeof latitude !== 'number' || isNaN(latitude)) {
    errors.push("La latitud debe ser un número válido");
  } else if (latitude < -90 || latitude > 90) {
    errors.push("La latitud debe estar entre -90 y 90 grados");
  }

  if (typeof longitude !== 'number' || isNaN(longitude)) {
    errors.push("La longitud debe ser un número válido");
  } else if (longitude < -180 || longitude > 180) {
    errors.push("La longitud debe estar entre -180 y 180 grados");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida URL de imagen
 * @param {string} imageUrl - URL de imagen a validar
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validateImageUrl = (imageUrl) => {
  const errors = [];

  if (imageUrl && typeof imageUrl !== 'string') {
    errors.push("La URL de imagen debe ser una cadena de texto");
  } else if (imageUrl && imageUrl.trim().length > 0) {
    if (!validator.isURL(imageUrl, { protocols: ['http', 'https'], require_protocol: true })) {
      errors.push("La URL de imagen debe ser una URL válida con protocolo http o https");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida datos de lugar
 * @param {Object} placeData - Datos del lugar { name, address, latitude, longitude, image? }
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validatePlaceData = (placeData) => {
  const errors = [];

  if (!placeData.name || typeof placeData.name !== 'string' || placeData.name.trim().length === 0) {
    errors.push("El nombre del lugar es requerido");
  }

  if (!placeData.address || typeof placeData.address !== 'string' || placeData.address.trim().length === 0) {
    errors.push("La dirección del lugar es requerida");
  }

  const coordValidation = validateCoordinates(placeData.latitude, placeData.longitude);
  if (!coordValidation.isValid) {
    errors.push(...coordValidation.errors);
  }

  const imageValidation = validateImageUrl(placeData.image);
  if (!imageValidation.isValid) {
    errors.push(...imageValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
