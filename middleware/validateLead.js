function validateLeadPayload(payload = {}) {
  const { name, phone, email } = payload;
  const errors = [];

  const normalizedPayload = {
    ...payload,
    name: name ? String(name).trim() : name,
    phone: phone ? String(phone).trim() : phone,
    email: email ? String(email).trim() : email,
  };

  if (!normalizedPayload.name) {
    errors.push('name is required');
  }

  if (!normalizedPayload.phone) {
    errors.push('phone is required');
  }

  if (
    normalizedPayload.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedPayload.email)
  ) {
    errors.push('email format is invalid');
  }

  return {
    isValid: errors.length === 0,
    errors,
    value: normalizedPayload,
  };
}

function validateLead(req, res, next) {
  const validation = validateLeadPayload(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors,
    });
  }

  req.body = validation.value;

  next();
}

module.exports = validateLead;
module.exports.validateLeadPayload = validateLeadPayload;