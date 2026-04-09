const {
  isWhatsAppConfigured,
  sendWhatsAppConfirmation,
} = require('./whatsappService');

async function triggerWhatsAppIntegration(formData = {}) {
  if (!isWhatsAppConfigured()) {
    console.log('WhatsApp skipped - API key missing');
    return 'skipped';
  }

  try {
    await sendWhatsAppConfirmation({
      ...formData,
      formType: formData.formType || 'inquiry',
    });
    return 'sent';
  } catch (error) {
    console.error('WhatsApp failed:', error.message);
    return 'skipped';
  }
}

async function sendWhatsAppPartner(formData = {}) {
  if (!process.env.WHATSAPP_KEY && !isWhatsAppConfigured()) {
    console.log('WhatsApp skipped - API key missing');
    return 'skipped';
  }

  try {
    await sendWhatsAppConfirmation({
      ...formData,
      formType: 'partner application',
      name: formData.contactName || formData.name,
    });
    return 'sent';
  } catch (error) {
    console.error('WhatsApp failed:', error.message);
    return 'skipped';
  }
}

module.exports = {
  isWhatsAppConfigured,
  sendWhatsAppConfirmation,
  sendWhatsAppPartner,
  triggerWhatsAppIntegration,
};