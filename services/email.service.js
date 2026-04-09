const { Resend } = require('resend');

const EMAIL_COLORS = {
  primary: '#4f46e5',
  background: '#f9fafb',
  text: '#111827',
  border: '#e5e7eb',
  muted: '#6b7280',
  surface: '#ffffff',
  altRow: '#f3f4f6',
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not defined in the environment variables.');
  }

  return new Resend(apiKey);
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
}

function getAdminEmails() {
  if (!process.env.RESEND_TO_EMAIL) {
    return ['onboarding@resend.dev'];
  }

  const recipients = process.env.RESEND_TO_EMAIL.split(',')
    .map((email) => email.trim())
    .filter(Boolean);

  return recipients.length > 0 ? recipients : ['onboarding@resend.dev'];
}

function getWebsiteUrl() {
  return process.env.WEBSITE_URL || process.env.FRONTEND_URL || 'https://intexa.com';
}

function getContactEmail() {
  return process.env.CONTACT_EMAIL || getAdminEmails()[0] || getFromEmail();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDisplayValue(value) {
  if (value === undefined || value === null) {
    return 'Not provided';
  }

  const normalizedValue = String(value).trim();
  return normalizedValue || 'Not provided';
}

function buildAdminPayload(formData = {}) {
  return {
    inquiryId: formData.inquiryId,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    city: formData.city,
    propertyType: formData.propertyType,
    budget: formData.budget,
    timeline: formData.timeline,
    message: formData.message,
    source: formData.source,
    stepCompleted: formData.stepCompleted,
    status: formData.status,
  };
}

function buildPartnerAdminPayload(formData = {}) {
  return {
    partnerId: formData.partnerId,
    studioName: formData.studioName,
    yearOfEstablishment: formData.yearOfEstablishment,
    founderName: formData.founderName,
    teamSize: formData.teamSize,
    contactName: formData.contactName || formData.name,
    phone: formData.phone,
    email: formData.email,
    city: formData.city,
    specialization: formData.specialization,
    projectValueRange: formData.projectValueRange,
    portfolioLink: formData.portfolioLink,
    website: formData.website,
    gstNumber: formData.gstNumber,
    clientRef1: formData.clientRef1,
    clientRef2: formData.clientRef2,
    consent: formData.consent,
    status: formData.status,
  };
}

function buildAdminTextFallback(payload = {}) {
  return Object.entries(payload)
    .map(([key, value]) => `${key}: ${formatDisplayValue(value)}`)
    .join('\n');
}

function renderAdminEmailTemplate(payload = {}) {
  const rows = Object.entries(payload)
    .map(([key, value], index) => {
      const backgroundColor = index % 2 === 0 ? EMAIL_COLORS.surface : EMAIL_COLORS.altRow;

      return `
        <tr style="background-color:${backgroundColor};">
          <td style="border:1px solid ${EMAIL_COLORS.border};padding:14px 16px;font-size:14px;font-weight:600;color:${EMAIL_COLORS.text};text-transform:capitalize;width:34%;">
            ${escapeHtml(key)}
          </td>
          <td style="border:1px solid ${EMAIL_COLORS.border};padding:14px 16px;font-size:14px;color:${EMAIL_COLORS.text};">
            ${escapeHtml(formatDisplayValue(value))}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="margin:0;padding:24px;background-color:${EMAIL_COLORS.background};font-family:Arial,sans-serif;color:${EMAIL_COLORS.text};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background-color:${EMAIL_COLORS.surface};border:1px solid ${EMAIL_COLORS.border};border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:24px 32px;background-color:${EMAIL_COLORS.primary};color:#ffffff;">
            <div style="font-size:24px;font-weight:700;line-height:1.2;">Intexa</div>
            <div style="margin-top:8px;font-size:20px;font-weight:600;line-height:1.3;">New Lead Received</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 24px 12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;border:1px solid ${EMAIL_COLORS.border};">
              ${rows}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 24px 24px;font-size:13px;line-height:1.5;color:${EMAIL_COLORS.muted};">
            This lead was generated from your website.
          </td>
        </tr>
      </table>
    </div>
  `;
}

function buildAdminEmailTemplate(formData = {}) {
  return renderAdminEmailTemplate(buildAdminPayload(formData));
}

function buildUserEmailTemplate(formData = {}) {
  const userName = formData.name || formData.contactName;
  const name = userName ? String(userName).trim() : 'there';
  const websiteUrl = escapeHtml(getWebsiteUrl());
  const contactEmail = escapeHtml(getContactEmail());

  return `
    <div style="margin:0;padding:24px;background-color:${EMAIL_COLORS.background};font-family:Arial,sans-serif;color:${EMAIL_COLORS.text};text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;margin:0 auto;background-color:${EMAIL_COLORS.surface};border:1px solid ${EMAIL_COLORS.border};border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(17,24,39,0.08);">
        <tr>
          <td style="padding:28px 32px 20px;background-color:${EMAIL_COLORS.primary};color:#ffffff;">
            <div style="font-size:28px;font-weight:700;line-height:1.2;">Intexa</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px 20px;">
            <div style="font-size:22px;font-weight:700;line-height:1.3;color:${EMAIL_COLORS.text};margin-bottom:16px;">Hi ${escapeHtml(name)}</div>
            <div style="font-size:15px;line-height:1.7;color:${EMAIL_COLORS.text};margin-bottom:28px;">
              Thank you for contacting us. Our team will get back to you shortly.
            </div>
            <a href="${websiteUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background-color:${EMAIL_COLORS.primary};color:#ffffff;font-size:14px;font-weight:600;line-height:1;text-decoration:none;">Visit Website</a>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 32px;">
            <div style="font-size:14px;line-height:1.7;color:${EMAIL_COLORS.muted};border-top:1px solid ${EMAIL_COLORS.border};padding-top:20px;">
              <div style="font-weight:600;color:${EMAIL_COLORS.text};">Intexa Team</div>
              <div style="margin-top:6px;">${contactEmail}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

async function sendAdminEmail(formData = {}, options = {}) {
  const resend = getResendClient();
  const payload = buildAdminPayload(formData);

  return resend.emails.send({
    from: getFromEmail(),
    to: getAdminEmails(),
    subject: options.subject || 'New Lead Received',
    text: buildAdminTextFallback(payload),
    html: buildAdminEmailTemplate(formData),
    replyTo: formData.email || undefined,
  });
}

async function sendPartnerAdminEmail(formData = {}, options = {}) {
  const resend = getResendClient();
  const payload = buildPartnerAdminPayload(formData);

  return resend.emails.send({
    from: getFromEmail(),
    to: getAdminEmails(),
    subject: options.subject || 'New Partner Application Received',
    text: buildAdminTextFallback(payload),
    html: renderAdminEmailTemplate(payload),
    replyTo: formData.email || undefined,
  });
}

async function sendUserConfirmation(formData = {}, options = {}) {
  const recipientEmail = formData.email ? String(formData.email).trim() : '';

  if (!recipientEmail) {
    return null;
  }

  const resend = getResendClient();

  try {
    return await resend.emails.send({
      from: getFromEmail(),
      to: recipientEmail,
      subject: options.subject || 'We received your inquiry — Our team will get back to you shortly',
      html: buildUserEmailTemplate(formData),
    });
  } catch (error) {
    console.error('User confirmation email failed:', error.message);
    return null;
  }
}

async function sendPartnerUserEmail(formData = {}, options = {}) {
  const recipientEmail = formData.email ? String(formData.email).trim() : '';

  if (!recipientEmail) {
    throw new Error('Partner email is required for confirmation email.');
  }

  const resend = getResendClient();

  return resend.emails.send({
    from: getFromEmail(),
    to: recipientEmail,
    subject: options.subject || 'Your partner application has been received',
    html: buildUserEmailTemplate({
      ...formData,
      name: formData.contactName || formData.name,
    }),
  });
}

module.exports = {
  buildAdminEmailTemplate,
  buildUserEmailTemplate,
  sendAdminEmail,
  sendPartnerAdminEmail,
  sendPartnerUserEmail,
  sendUserConfirmation,
  sendUserEmail: sendUserConfirmation,
};