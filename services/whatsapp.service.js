const {
  isWhatsAppConfigured,
  sendWhatsAppConfirmation,
  sendWhatsAppMessage,
  sendTeamWhatsApp,
} = require('./whatsappService');

async function triggerWhatsAppIntegration(formData = {}) {
  if (!isWhatsAppConfigured()) {
    console.log('WhatsApp skipped - API key missing');
    return 'skipped';
  }

  try {
    const userResult = await sendWhatsAppMessage({
      phone: formData.phone,
      name: formData.name,
      inquiryId: formData.inquiryId,
    });

    const teamResult = await sendTeamWhatsApp({
      phone: formData.phone,
      name: formData.contactName || formData.name,
      inquiryId: formData.inquiryId,
    });

    return userResult || teamResult ? 'sent' : 'skipped';
  } catch (error) {
    console.error('WhatsApp failed:', error.message);
    return 'skipped';
  }
}

async function sendWhatsAppPartner(formData = {}) {
  if (!isWhatsAppConfigured()) {
    console.log('WhatsApp skipped - API key missing');
    return 'skipped';
  }

  try {
    const userResult = await sendWhatsAppMessage({
      phone: formData.phone,
      name: formData.contactName || formData.name,
      inquiryId: formData.inquiryId,
    });

    const teamResult = await sendTeamWhatsApp({
      phone: formData.phone,
      name: formData.contactName || formData.name,
      inquiryId: formData.inquiryId,
    });

    return userResult || teamResult ? 'sent' : 'skipped';
  } catch (error) {
    console.error('WhatsApp failed:', error.message);
    return 'skipped';
  }
}

module.exports = {
  isWhatsAppConfigured,
  sendWhatsAppMessage,
  sendWhatsAppConfirmation,
  sendTeamWhatsApp,
  sendWhatsAppPartner,
  triggerWhatsAppIntegration,
};