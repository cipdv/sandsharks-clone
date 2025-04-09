import { NextResponse } from "next/server";
import { Resend } from "resend";
import { sql } from "@vercel/postgres";

// Email template function embedded directly in the API route
function renderSeasonAnnouncementEmail() {
  // Hardcode the base URL
  const baseUrl = "https://www.sandsharks.ca";

  // Create URLs for the buttons
  const donateUrl = `${baseUrl}/dashboard/member?from=email&target=donations`;
  const volunteerUrl = `${baseUrl}/dashboard/member?from=email&target=volunteering`;
  const sponsorUrl = `${baseUrl}/dashboard/member?from=email&target=become-a-sponsor`;
  const profileUrl = `${baseUrl}/dashboard/member?from=email&target=profile`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sandsharks 2024 Season Announcement - Important Updates!</title>
        <meta name="description" content="Beach volleyball season is here! Important updates about courts, donations, volunteering, and more.">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
          }
          .email-header {
            background-color: #009933;
            padding: 20px;
            text-align: center;
          }
          .email-header img {
            max-height: 60px;
            margin-bottom: 10px;
          }
          .email-header h1 {
            color: white;
            margin: 0;
            font-size: 24px;
            font-weight: bold;
          }
          .email-content {
            padding: 20px;
            background-color: #ffffff;
          }
          .email-footer {
            background-color: #f5f5f5;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #666666;
          }
          .email-footer a {
            color: #666666;
            text-decoration: underline;
          }
          @media screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <img src="${baseUrl}/images/sandsharks-rainbow-icon.svg" alt="Toronto Sandsharks Logo" />
            <h1>Toronto Sandsharks Beach Volleyball League</h1>
          </div>
          
          <div class="email-content">
            <p style="color: #333333;">Hellooooo Sandsharks,</p>
            
            <p style="color: #333333;">We are back! Summer is just around the corner and I have some great news for y'all . . . we officially have permits for beach courts for the season!</p>
            
            <p style="color: #333333;">I got us a pretty sweet spot near the trees to call our homebase for most of the Summer. I've already posted the days we'll be able to play this Summer on the website for those who want to plan ahead. I'll also add some more play days for April/May once the weather starts warming up.</p>
            
            <p style="color: #333333;">You'll get an email every week with a schedule for the upcoming weekend (you can opt out of these emails anytime at sandsharks.ca/unsubscribe).</p>
            
            <p style="color: #333333;">Make sure to include this email in your safe-senders list: sandsharks@sandsharks.ca to get the weekly updates.</p>
            
            <h2 style="color: #17677a; margin-top: 30px; margin-bottom: 15px;">So what does this all mean?</h2>
            
            <h3 style="color: #17677a; margin-top: 25px;">Donations</h3>
            <p style="color: #333333;">This is the first year that we've had to get permits to play, so I'll need your help to cover the costs of the court rentals, insurance, equipment storage, replacing worn out equipment, website costs, and more.</p>
            <p style="color: #333333;">I've added a link on the website to make a donation to Sandsharks. Donations are pay-what-you-can, with a suggested amount of $40/player for the entire Summer.</p>
            <p style="color: #333333;">Please donate as soon as you can - I've had to pay for everything upfront, and it ain't cheap.</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${donateUrl}" style="display: inline-block; background-color: #2ebebe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">DONATE NOW</a>
            </div>
            
            <h3 style="color: #17677a; margin-top: 25px;">Volunteering</h3>
            <p style="color: #333333;">Now that we have permits, and a storage locker near the beach for the equipment, I am hoping that this will encourage some of you long-time Sandsharks and some of you new enthusiastic Sharks to volunteer to set things up for a day or two during the Summer.</p>
            <p style="color: #333333;">I'm really hoping we can make this a group effort by having 1-2 volunteers (myself being the default volunteer) every day we play, so you can sign up by yourself or with a friend!</p>
            <p style="color: #333333;">It'll be easier than ever and I'll teach you everything you need to know to run a fun day of beach volleyball!</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${volunteerUrl}" style="display: inline-block; background-color: #2ebebe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">SIGN UP TO VOLUNTEER</a>
            </div>

            <h3 style="color: #17677a; margin-top: 25px;">Connect</h3>
            <p style="color: #333333;">Let's see those pretty faces! Please consider uploading a photo to your profile - it really helps new members get to know everyone (and helps me remember everybody's names haha).</p>
            <p style="color: #333333;">I've also added an option to share your instagram handle on your profile as well for those looking to connect with other players.</p>
            <p style="color: #333333;">I'd love to take more photos of Sandsharks throughout the Summer as well! It's always fun to look back at past Summers.</p>
            <p style="color: #333333;">I've considered setting up an Instagram account for Sandsharks to help members connect, but I don't personally want to be in charge of it, so if someone wants to volunteer to run the Sandsharks Instagram account, please reach out to me: sandsharks.org@gmail.com.</p>
            <p style="color: #333333;">No pressure though, if you want to stay "discrete" I've added an option to opt out of being included in any photos posted on the Sandsharks website/social media that you can update anytime on your profile.</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${profileUrl}" style="display: inline-block; background-color: #2ebebe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">UPDATE PROFILE</a>
            </div>
            
            <h3 style="color: #17677a; margin-top: 25px;">Sponsoring</h3>
            <p style="color: #333333;">This being the first year we've had large costs associated with running Sandsharks, I'd still like to seek out sponsorships from members within the league who run a business to help support the costs of running Sandsharks. If there is enough interest in sponsorships, this will help establish how we can cover costs in future seasons.</p>
            <p style="color: #333333;">Sponsors are asked to cover the costs of running Sandsharks for one of the days we're playing ($200). As a thank you, I'll include your logo, links to your website and social media, and a description of your company on the day you're sponsoring, and in all email communications for that day to our 300+ members.</p>
            <p style="color: #333333;">It's a great way to show your support and advertise your business and I'm hoping it'll encourage our members to support a fellow Shark's business.</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="${sponsorUrl}" style="display: inline-block; background-color: #2ebebe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">SIGN UP TO BECOME A SPONSOR</a>
            </div>
            
            
            
            <h3 style="color: #17677a; margin-top: 25px;">Spread the Word</h3>
            <p style="color: #333333;">Lastly, let's get the word out that this is going to be a super fun season! Tell your friends and playmates to come give Sandsharks a try this Summer!</p>
            
            <p style="color: #333333; margin-top: 30px;">Thanks everyone for your support and good vibes - I'm looking forward to this upcoming season,</p>
            <p style="color: #333333;">-Cip</p>
          </div>
          
          <div class="email-footer">
            <p><a href="${baseUrl}/unsubscribe" style="color: #666666; text-decoration: underline;">Unsubscribe from emails</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function GET(request) {
  try {
    // Get all members who want to receive emails
    const membersResult = await sql`
      SELECT id, first_name, last_name, email 
      FROM members 
      WHERE email_list = true
    `;

    if (membersResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No members found who want to receive emails",
        totalEmails: 0,
      });
    }

    console.log(`Found ${membersResult.rows.length} members to email`);

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Generate the email content (same for all recipients)
    const emailHtml = renderSeasonAnnouncementEmail();

    // Extract just the email addresses for BCC
    const bccEmails = membersResult.rows.map((member) => member.email);

    // In development, only send to a test email
    const toEmail =
      process.env.NODE_ENV === "development"
        ? "cip.devries@gmail.com"
        : "sandsharks@sandsharks.ca";

    const bccList =
      process.env.NODE_ENV === "development"
        ? ["cip.devries@gmail.com"]
        : bccEmails;

    // Send a single email with all recipients in BCC
    const { data, error } = await resend.emails.send({
      from: "Sandsharks <sandsharks@sandsharks.ca>",
      to: "cip.devries@gmail.com",
      bcc: "cdvsignupspare@gmail.com",
      subject: "Sandsharks 2025 Season Announcement - Please Read :)",
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending season announcement email:", error);
      return NextResponse.json(
        {
          success: false,
          error: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      totalEmails: bccList.length,
      messageId: data?.id,
      message: `Successfully sent season announcement email to ${bccList.length} members`,
    });
  } catch (error) {
    console.error("Error sending season announcement emails:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
