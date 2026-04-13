const { isZohoConfigured, sendLeadToZoho, sendToZoho } = require('./zohoService');

async function triggerZohoIntegration(formData = {}) {
  if (!isZohoConfigured()) {
    console.log('Zoho skipped - credentials missing');
    return 'skipped';
  }

  try {
    await sendToZoho(formData);
    return 'sent';
  } catch (error) {
    console.error('Zoho failed:', error.message);
    return 'skipped';
  }
}

async function sendZohoPartner(formData = {}) {
  if (!process.env.ZOHO_KEY && !isZohoConfigured()) {
    console.log('Zoho skipped - credentials missing');
    return 'skipped';
  }

  try {
    await sendLeadToZoho({
      ...formData,
      name: formData.contactName || formData.name,
      businessName: formData.studioName || formData.businessName,
      message: formData.message || `Partner application from ${formData.studioName || 'studio'}`,
      source: formData.source || 'Partner Application',
    });
    return 'sent';
  } catch (error) {
    console.error('Zoho failed:', error.message);
    return 'skipped';
  }
}

module.exports = {
  isZohoConfigured,
  sendLeadToZoho,
  sendToZoho,
  sendZohoPartner,
  triggerZohoIntegration,
};