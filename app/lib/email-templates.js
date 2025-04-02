import { EmailTemplate } from "@/components/emails/EmailTemplate";

/**
 * Renders a welcome email for new members
 */
export function renderWelcomeEmail({ firstName, memberId, currentYear }) {
  const content = `
      <h2>Welcome to Sandsharks!</h2>
      <p>Hi ${firstName},</p>
      <p>We are excited to have you join our community.</p>
      <p>
        My name is Cip, I run the league and I'm here to help you get started.
      </p>
      <p>
        Now that you're signed up, you can login at sandsharks.ca to check the
        season schedule to see when we'll be playing. Once you login, you'll need to accept the waiver and agree to the code of conduct to continue.
      </p>
      
      <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-left: 4px solid #0066cc;">
        <p style="font-weight: bold; margin-top: 0;">Sandsharks is run solely by volunteers and donations from members like you.</p>
        <p>Once logged in, please consider making a donation to Sandsharks for the ${currentYear} season. Donations are pay-what-you-can, with a suggested donation of $40 per player for the entire season to help cover costs of court rentals, replacing worn out equipment, storage, website fees, and more.</p>
        <p style="margin-bottom: 0;"><a href="https://sandsharks.ca/donate" style="display: inline-block; background-color: #0066cc; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px;">Donate Today</a></p>
      </div>
      
      <h3 style="color: #0066cc; margin-top: 25px;">If you do not have any experience playing 2v2 beach volleyball or have some experience playing indoor volleyball at a recreational level:</h3>
      <p>
        Have no fear, we run free clinics on most weekends to help beginner
        players learn how to play the game. I would like you to start with the
        beginner clinic before jumping into playing games with the group, and
        once I see that you can consistently serve, pass, set, and attack the
        ball, then you can join in with the rest of the group.
      </p>
      <p>
        Check the season schedule to see which days the clinic is offered. If you plan on coming, please click
        the "Yas, plz help me!" button. There is limited space for new players
        in the clinic, so if you can no longer make it, please click the "I
        can't make it anymore" button so that someone else can take that spot.
        Feel free to bring a friend, just make sure they have also signed up on
        the website, completed the waiver, and have RSVP'd to the weekly post.
      </p>
      
      <h3 style="color: #0066cc; margin-top: 25px;">If you have experience playing beach volleyball or indoor volleyball at a competitive level:</h3>
      <p>
        Check the website for the schedule of when we'll be playing this Summer. If you plan on coming, please click the "I'll be
        there!" button, it helps me know how much equipment to bring to the
        beach, and please click the "I can no longer make it" button if you
        change your mind.
      </p>
      <p>
        The start times, end times and court numbers are posted on the website, along with which volunteers will be in charge that day. When you arrive, ask anyone for the volunteer in charge that day before jumping into any games. They'll show you
        how to use the sign-up sheets to get started playing games with us. You
        can stay for as long as you'd like and play as many games as you like.
      </p>
      <p>
        There's no need to bring a partner because you'll be playing with a
        different person every game, but feel welcome to bring a friend, just
        make sure they have also signed up on the website, completed the waiver,
        and have RSVP'd to the weekly post.
      </p>
      <p>
        If you have only played indoor volleyball,
        <a href="https://www.youtube.com/watch?v=FzO7EvB7mDE" style="color: #0066cc; text-decoration: underline;">
          here's a great video
        </a>
        that explains all the unique rules of 2v2 beach volleyball. The complete
        rules of 2v2 beach volleyball are posted on
        <a href="https://www.sandsharks.ca/member/rules" style="color: #0066cc; text-decoration: underline;">
          sandsharks.ca/member/rules
        </a>.
      </p>
      
      <div style="margin-top: 25px; border-top: 1px solid #eee; padding-top: 15px;">
        <p>
          If you have any questions, feel free to email me at
          <a href="mailto:sandsharks.org@gmail.com" style="color: #0066cc; text-decoration: underline;">sandsharks.org@gmail.com</a>.
        </p>
        <p>I'm looking forward to welcoming you into the group!</p>
        <p style="margin-bottom: 5px;">See you on the sand,</p>
        <p style="margin-top: 0; margin-bottom: 5px;"><strong>Cip</strong></p>
        <p style="margin-top: 0;">sandsharks.org@gmail.com</p>
      </div>
    `;

  return EmailTemplate({
    subject: "Welcome to Sandsharks!",
    preheaderText: "Welcome to the Toronto Sandsharks Beach Volleyball League",
    content,
    memberId,
    templateType: "default",
  });
}

/**
 * Renders a password reset email
 */
export function renderPasswordResetEmail({
  firstName,
  resetURL,
  memberId,
  baseUrl,
}) {
  const content = `
      <h2>Password Reset Request</h2>
      <p>Hello ${firstName || "there"}!</p>
      
      <p>You, or someone else, has requested to reset your password for your Sandsharks account.</p>
      
      <div style="margin: 30px 0; text-align: center;">
        <a href="${resetURL}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
          Reset Your Password
        </a>
      </div>
      
      <p><strong>Important:</strong> This link will expire in 1 hour.</p>
      
      <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
      
      <p style="margin-top: 30px;">See you on the sand!</p>
    `;

  return EmailTemplate({
    subject: "Sandsharks Password Reset Request",
    preheaderText: "Reset your Sandsharks account password",
    content,
    memberId,
    templateType: "alert", // Using alert template type for password reset
  });
}

/**
 * Renders a donation thank you email
 */
export function renderDonationThankYouEmail({
  firstName,
  amount,
  donationDate,
  memberId,
}) {
  // Format the amount with dollar sign and two decimal places
  const formattedAmount = `$${amount.toFixed(2)}`;

  // Format the donation date
  const formattedDate = donationDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const content = `
      <h3>Hi ${firstName || "Shark"}!</h3>
      
      <p>Thank you so much for donating to Sandsharks. I really appreciate your help to keep things running.</p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6600;">
        <h3 style="margin-top: 0; color: #ff6600;">Donation Details</h3>
        <p><strong>Amount:</strong> ${formattedAmount}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
      </div>
      
      
      <p>See you on the sand!</p>
      <p style="font-style: italic;">-Cip</p>
    `;

  return EmailTemplate({
    subject: "Thank You for Your Donation to Sandsharks Beach Volleyball",
    preheaderText: "Thank you for supporting Sandsharks Beach Volleyball",
    content,
    memberId,
    templateType: "event",
  });
}

/**
 * Renders a play day announcement email
 */
export function renderPlayDayAnnouncementEmail({
  playDay,
  formattedDate,
  timeRange,
  volunteerSection,
  sponsorSection,
  clinicSection,
  needsDonationMessage,
  memberId,
}) {
  const content = `
    <h2>${formattedDate} - Beach Volleyball Play Day</h2>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #0066cc;">${playDay.title}</h3>
      <p><strong>Time:</strong> ${timeRange}</p>
      <p><strong>Courts:</strong> ${playDay.courts}</p>
      <p>${playDay.description}</p>

      ${clinicSection || ""}
      ${volunteerSection || ""}
      ${sponsorSection || ""}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://sandsharks.ca/dashboard/play-day/${playDay.id}"
         style="display: inline-block; background-color: #ff6600; color: white;
                padding: 12px 25px; text-decoration: none; border-radius: 5px;
                font-weight: bold; font-size: 16px;">
        RSVP TO PLAY
      </a>
    </div>

    ${needsDonationMessage || ""}
  `;

  return EmailTemplate({
    subject: `New Beach Volleyball Day: ${formattedDate}`,
    preheaderText: `Join us for beach volleyball on ${formattedDate}`,
    content,
    memberId,
    templateType: "event",
  });
}

/**
 * Renders a play day cancellation email
 */
export function renderPlayDayCancellationEmail({
  playDay,
  formattedDate,
  timeRange,
  cancellationReason,
}) {
  const content = `
        <h3 style="color: #333333;">Sandsharks Beach Volleyball Cancelled</h3>
        <p style="color: #333333;">Hey Sharks!</p>
        
        <p style="color: #333333;">The following play day has been <strong style="color: #333333;">cancelled</strong>:</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6600;">
          <h3 style="margin-top: 0; color: #ff6600;">${formattedDate}</h3>
          <p style="color: #333333;"><strong style="color: #333333;">Time:</strong> ${timeRange}</p>
        </div>
  
        <div style="background-color: #fff8f0; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h3 style="margin-top: 0; color: #ff6600;">Reason for Cancellation:</h3>
          <p style="color: #333333;">${cancellationReason}</p>
        </div>
        
        <p style="color: #333333;">Please check <a href="https://www.sandsharks.ca" style="color: #0066cc; text-decoration: underline;">sandsharks.ca</a> for updates on future play days.</p>
        <p style="font-style: italic; color: #666;">-Cip</p>
      `;

  return EmailTemplate({
    subject: `Sandsharks is cancelled on ${formattedDate}`,
    preheaderText: `Beach volleyball on ${formattedDate} has been cancelled`,
    content,
    // No memberId for bulk emails
    templateType: "alert",
  });
}

export function renderUnsubscribeConfirmationEmail({ firstName, memberId }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sandsharks.ca";

  const content = `
      <h2>Unsubscribe Confirmation</h2>
      <p>Hello ${firstName || "there"},</p>
      
      <p>You have been successfully unsubscribed from Sandsharks email communications.</p>
      
      <p>If you unsubscribed by mistake or would like to resubscribe in the future, you can update your preferences by logging into your account at <a href="${baseUrl}" style="color: #0066cc; text-decoration: underline;">sandsharks.ca</a>.</p>
      
      <p style="margin-top: 30px;">Thank you for being part of the Sandsharks community!</p>
    `;

  return EmailTemplate({
    subject: "You've been unsubscribed from Sandsharks emails",
    preheaderText: "Confirmation of your unsubscribe request",
    content,
    memberId,
    templateType: "default",
  });
}

export function renderEmailBlastEmail({
  content,
  subject,
  firstName,
  memberId,
  needsDonation,
  currentYear,
}) {
  // Add donation message if needed
  let fullContent = content;

  if (needsDonation) {
    const donationMessage = `
        <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #ff6600;">
          <p><strong>Please consider making a donation to Sandsharks for the ${currentYear} season.</strong></p>
          <p>Sandsharks is run solely by volunteers and donations from members like you. Donations cover the costs of court rentals, storage, new equipment, insurance, website hosting, and more. Donations are pay-what-you-can, with a suggested donation of $40 for the entire season.</p>
          <p><a href="https://sandsharks.ca/donate" style="display: inline-block; background-color: #ff6600; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">Donate Now</a></p>
        </div>
      `;

    fullContent = `${content}${donationMessage}`;
  }

  // Add greeting with first name if available
  if (firstName) {
    fullContent = `<p>Hello ${firstName},</p>${fullContent}`;
  }

  return EmailTemplate({
    subject,
    preheaderText: `${subject} - Sandsharks Beach Volleyball`,
    content: fullContent,
    memberId,
    templateType: "update",
  });
}

export function renderAccountDeletionEmail({ firstName }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sandsharks.ca";

  const content = `
      <p style="font-size: 18px; color: #333333;">Hello ${firstName || "there"},</p>
      
      <p style="color: #333333;">Your Sandsharks account has been successfully deleted as requested.</p>
      
      <p style="color: #333333;">All your personal information and data have been removed from our system.</p>
      
      <p style="color: #333333;">If you change your mind and would like to rejoin Sandsharks in the future, you're always welcome to create a new account at <a href="${baseUrl}" style="color: #0066cc; text-decoration: underline;">sandsharks.ca</a>.</p>
      
      <p style="margin-top: 30px; color: #333333;">Thank you for being part of the Sandsharks community!</p>
    `;

  return EmailTemplate({
    subject: "Your Sandsharks Account Has Been Deleted",
    preheaderText: "Confirmation of your account deletion",
    content,
    // No memberId since the account is deleted
    templateType: "default",
  });
}

export function renderVolunteerSignupEmail({ firstName, lastName, email }) {
  const content = `
      <h2 style="color: #0066cc;">New Volunteer Sign-up</h2>
      <p style="color: #333333;">A member has expressed interest in volunteering with Sandsharks:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #0066cc;">
        <p style="color: #333333;"><strong style="color: #333333;">Name:</strong> ${firstName} ${lastName}</p>
        <p style="color: #333333;"><strong style="color: #333333;">Email:</strong> ${email}</p>
      </div>
      
      <p style="color: #333333;">Please reach out to them with more information about volunteering opportunities.</p>
    `;

  return EmailTemplate({
    subject: "New Volunteer Sign-up",
    preheaderText: `${firstName} ${lastName} has signed up to volunteer with Sandsharks`,
    content,
    templateType: "update",
  });
}

export function renderVolunteerApprovalEmail({
  firstName,
  title,
  formattedDate,
  position,
}) {
  const content = `
      <h2 style="color: #3b82f6; margin-bottom: 20px;">Volunteer Request Approved</h2>
      
      <p style="color: #333333;">Hi ${firstName},</p>
      
      <p style="color: #333333;">Great news! Your request to volunteer for the play day on <strong style="color: #333333;">${formattedDate}</strong> has been approved.</p>
      
      <p style="color: #333333;"><strong style="color: #333333;">Play Day:</strong> ${title}</p>
      <p style="color: #333333;"><strong style="color: #333333;">Date:</strong> ${formattedDate}</p>
      <p style="color: #333333;"><strong style="color: #333333;">Role:</strong> ${
        position === "main" ? "Main Volunteer" : "Helper Volunteer"
      }</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 3px;">
        <p style="margin: 0; font-weight: bold; color: #333333;">What's Next?</p>
        <p style="margin-top: 10px; color: #333333;">Please log in to your account to view the play day details and any updates. As a volunteer, you'll be able to post updates about the play day for other members to see.</p>
          <p>Remember to check the <a href="https://sandsharks.ca/dashboard/member/volunteer-guide" style="display: inline-block; background-color: #ff6600; color: white; padding: 8px 15px; text-decoration: none; border-radius: 4px; margin-top: 10px;">volunteer guide</a> for all the information you need on your volunteer day.</p>

        </div>
      
      <p style="color: #333333;">Thank you for volunteering! Sandsharks couldn't do it without people like you :)</p>
      
      <p style="color: #333333;">-Cip</p>
    `;

  return EmailTemplate({
    subject: `Your Volunteer Request for ${formattedDate} has been Approved`,
    preheaderText: `Your volunteer request for ${formattedDate} has been approved`,
    content,
    templateType: "update",
  });
}

export function renderSponsorApprovalEmail({ firstName, sponsorName }) {
  const content = `
      <h2 style="color: #3b82f6; margin-bottom: 20px;">Sponsorship Request Approved</h2>
      
      <p style="color: #333333;">Hi ${firstName},</p>
      
      <p style="color: #333333;">Great news! Your sponsorship request for <strong style="color: #333333;">${sponsorName}</strong> has been approved.</p>
      
      <p style="color: #333333;">Your organization is now an official sponsor of Sandsharks Beach Volleyball. Your logo and information will be displayed on our website and included in our promotional materials.</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 3px;">
        <p style="margin: 0; font-weight: bold; color: #333333;">What's Next?</p>
        <p style="margin-top: 10px; color: #333333;">Our team will be in touch if we need any additional information or materials from you. You can log in to your account to view your sponsorship details at any time.</p>
      </div>
      
      <p style="color: #333333;">Thank you for supporting Sandsharks Beach Volleyball!</p>
      
      <p style="color: #333333;">Best regards,<br>The Sandsharks Team</p>
    `;

  return EmailTemplate({
    subject: "Your Sandsharks Sponsorship Request Has Been Approved",
    preheaderText: `Your sponsorship request for ${sponsorName} has been approved`,
    content,
    templateType: "update",
  });
}

// Template for sponsor rejection emails
export function renderSponsorRejectionEmail({
  firstName,
  sponsorName,
  rejectionReason,
}) {
  const content = `
      <h2 style="color: #3b82f6; margin-bottom: 20px;">Sponsorship Request Update</h2>
      
      <p style="color: #333333;">Hi ${firstName},</p>
      
      <p style="color: #333333;">Thank you for your interest in sponsoring Sandsharks Beach Volleyball.</p>
      
      <p style="color: #333333;">After careful consideration, we regret to inform you that we are unable to accept your sponsorship request for <strong style="color: #333333;">${sponsorName}</strong> at this time.</p>
      
      <div style="margin: 25px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #718096; border-radius: 3px;">
        <p style="margin: 0; font-weight: bold; color: #333333;">Feedback:</p>
        <p style="margin-top: 10px; color: #333333;">${rejectionReason}</p>
      </div>
      
      <p style="color: #333333;">We appreciate your support and encourage you to apply again in the future.</p>
      
      <p style="color: #333333;">Best regards,<br>The Sandsharks Team</p>
    `;

  return EmailTemplate({
    subject: "Update on Your Sandsharks Sponsorship Request",
    preheaderText: `An update on your sponsorship request for ${sponsorName}`,
    content,
    templateType: "default",
  });
}
