const validateLead = require('../middleware/validateLead');
const { sendAdminEmail, sendUserEmail } = require('./emailService');
const {
  sendWhatsAppConfirmation,
  sendTeamWhatsApp,
  isWhatsAppConfigured,
} = require('./whatsappService');
const { sendLeadToZoho, isZohoConfigured } = require('./zohoService');

function buildSuccessResponse() {
  return {
    success: true,
    message: 'Form submitted successfully',
  };
}

function buildErrorResponse(message, details) {
  return {
    success: false,
    message,
    ...(details ? { details } : {}),
  };
}

async function sendOptionalWhatsApp(leadPayload) {
  if (!isWhatsAppConfigured()) {
    console.log('WhatsApp skipped - API key missing');
    return 'skipped';
  }

  try {
    const userResult = await sendWhatsAppConfirmation(leadPayload);
    const teamResult = await sendTeamWhatsApp(leadPayload);

    return userResult || teamResult ? 'sent' : 'skipped';
  } catch (error) {
    console.error('WhatsApp failed:', error.message);
    return 'skipped';
  }
}

async function sendOptionalZohoLead(leadPayload) {
  if (!isZohoConfigured()) {
    console.log('Zoho skipped - credentials missing');
    return 'skipped';
  }

  try {
    await sendLeadToZoho(leadPayload);
    return 'sent';
  } catch (error) {
    console.error('Zoho failed:', error.message);
    return 'skipped';
  }
}

async function submitLead({
  req,
  res,
  model,
  buildPayload,
  buildLeadPayload,
}) {
  const validation = validateLead.validateLeadPayload(req.body);

  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors,
    });
  }

  const documentPayload = buildPayload(validation.value);
  let savedDocument;

  try {
    savedDocument = await model.create(documentPayload);
  } catch (error) {
    return res.status(error.status || 500).json(
      buildErrorResponse(error.message || 'Failed to save form data', error.details)
    );
  }

  const leadPayload = buildLeadPayload({
    savedDocument,
    validatedPayload: validation.value,
  });

  try {
    await sendAdminEmail(leadPayload);
  } catch (error) {
    return res.status(error.status || 500).json(
      buildErrorResponse(error.message || 'Failed to send admin email', error.details)
    );
  }

  await sendUserEmail(leadPayload);

  void sendOptionalWhatsApp(leadPayload);
  await sendOptionalZohoLead(leadPayload);

  return res.status(201).json(buildSuccessResponse());
}

module.exports = {
  submitLead,
};