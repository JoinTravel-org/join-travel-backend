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
 * Valida descripción de lugar
 * @param {string} description - Descripción a validar
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validateDescription = (description) => {
  const errors = [];

  if (!description || typeof description !== 'string') {
    errors.push("La descripción es requerida");
  } else {
    const trimmed = description.trim();
    if (trimmed.length === 0) {
      errors.push("La descripción no puede estar vacía");
    } else if (trimmed.length < 30) {
      errors.push("La descripción debe tener al menos 30 caracteres");
    } else if (trimmed.length > 1000) {
      errors.push("La descripción no puede exceder los 1000 caracteres");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida datos de lugar
 * @param {Object} placeData - Datos del lugar { name, address, latitude, longitude, image?, description?, city? }
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

  if (placeData.description !== undefined) {
    const descValidation = validateDescription(placeData.description);
    if (!descValidation.isValid) {
      errors.push(...descValidation.errors);
    }
  }

  if (placeData.city !== undefined && (typeof placeData.city !== 'string' || placeData.city.trim().length === 0)) {
    errors.push("La ciudad debe ser una cadena de texto no vacía");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida formato de fecha para itinerario
 * @param {string} date - Fecha a validar (formato YYYY-MM-DD)
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validateItineraryDate = (date) => {
  const errors = [];

  if (!date || typeof date !== 'string') {
    errors.push("La fecha es requerida");
  } else {
    const trimmed = date.trim();
    if (trimmed.length === 0) {
      errors.push("La fecha no puede estar vacía");
    } else {
      // Validar formato YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(trimmed)) {
        errors.push("La fecha debe tener el formato YYYY-MM-DD");
      } else {
        const dateObj = new Date(trimmed);
        if (isNaN(dateObj.getTime())) {
          errors.push("La fecha debe ser una fecha válida");
        } else {
          // Verificar que la fecha no sea en el pasado (opcional)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dateObj < today) {
            errors.push("La fecha no puede ser en el pasado");
          }
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida ID de lugar (UUID)
 * @param {string} placeId - ID del lugar a validar
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validatePlaceId = (placeId) => {
  const errors = [];

  if (!placeId || typeof placeId !== 'string') {
    errors.push("El ID del lugar es requerido");
  } else {
    const trimmed = placeId.trim();
    if (trimmed.length === 0) {
      errors.push("El ID del lugar no puede estar vacío");
    } else {
      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(trimmed)) {
        errors.push("El ID del lugar debe ser un UUID válido");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida item de itinerario
 * @param {Object} item - Item del itinerario { placeId, date }
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validateItineraryItem = (item) => {
  const errors = [];

  if (!item || typeof item !== 'object') {
    errors.push("El item del itinerario es requerido");
    return { isValid: false, errors };
  }

  const placeIdValidation = validatePlaceId(item.placeId);
  if (!placeIdValidation.isValid) {
    errors.push(...placeIdValidation.errors);
  }

  const dateValidation = validateItineraryDate(item.date);
  if (!dateValidation.isValid) {
    errors.push(...dateValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida nombre de itinerario
 * @param {string} name - Nombre del itinerario a validar
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validateItineraryName = (name) => {
  const errors = [];

  if (!name || typeof name !== 'string') {
    errors.push("El nombre del itinerario es requerido");
  } else {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      errors.push("El nombre del itinerario no puede estar vacío");
    } else if (trimmed.length < 3) {
      errors.push("El nombre del itinerario debe tener al menos 3 caracteres");
    } else if (trimmed.length > 100) {
      errors.push("El nombre del itinerario no puede exceder los 100 caracteres");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida datos de itinerario
 * @param {Object} itineraryData - Datos del itinerario { name, items }
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
export const validateItineraryData = (itineraryData) => {
  const errors = [];

  // Validar nombre
  const nameValidation = validateItineraryName(itineraryData.name);
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  // Validar items
  if (!itineraryData.items || !Array.isArray(itineraryData.items)) {
    errors.push("Los items del itinerario son requeridos y deben ser un array");
  } else if (itineraryData.items.length === 0) {
    errors.push("El itinerario debe tener al menos un lugar");
  } else if (itineraryData.items.length > 50) {
    errors.push("El itinerario no puede tener más de 50 lugares");
  } else {
    // Validar cada item
    itineraryData.items.forEach((item, index) => {
      const itemValidation = validateItineraryItem(item);
      if (!itemValidation.isValid) {
        itemValidation.errors.forEach(error => {
          errors.push(`Item ${index + 1}: ${error}`);
        });
      }
    });

    // Verificar duplicados de lugares
    const placeIds = itineraryData.items.map(item => item.placeId);
    const uniquePlaceIds = [...new Set(placeIds)];
    if (placeIds.length !== uniquePlaceIds.length) {
      errors.push("No se pueden agregar lugares duplicados al itinerario");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
