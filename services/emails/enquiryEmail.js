export const enquiryEmailTemplate = ({
  propertyTitle,
  propertySlug,
  name,
  contact,
  message,
  preferredContact,
}) => {
  return {
    subject: `New Enquiry – ${propertyTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#f7f9fc; padding:24px;">
        <div style="max-width:600px; margin:auto; background:#ffffff; padding:24px; border-radius:8px;">
          
          <h2 style="color:#0e2442; margin-bottom:12px;">
            New Property Enquiry
          </h2>

          <p style="color:#4e6c95; margin-bottom:20px;">
            A new enquiry has been submitted for the property below.
          </p>

          <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
            <tr>
              <td style="padding:8px 0; font-weight:bold;">Property</td>
              <td style="padding:8px 0;">${propertyTitle}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-weight:bold;">Name</td>
              <td style="padding:8px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-weight:bold;">Contact</td>
              <td style="padding:8px 0;">${contact}</td>
            </tr>
            <tr>
              <td style="padding:8px 0; font-weight:bold;">Preferred Contact</td>
              <td style="padding:8px 0; text-transform:capitalize;">
                ${preferredContact}
              </td>
            </tr>
          </table>

          ${
            message
              ? `<p style="margin-bottom:20px;"><strong>Message:</strong><br/>${message}</p>`
              : ""
          }

          <a
           href="${process.env.FRONTEND_URL}/properties/${propertySlug}"

            style="
              display:inline-block;
              padding:12px 18px;
              background:#0e2442;
              color:#ffffff;
              text-decoration:none;
              border-radius:6px;
              font-weight:bold;
            "
          >
            View Property
          </a>

          <p style="margin-top:30px; font-size:12px; color:#888;">
            This enquiry was generated via AB Real Estate.
          </p>

        </div>
      </div>
    `,
  };
};
