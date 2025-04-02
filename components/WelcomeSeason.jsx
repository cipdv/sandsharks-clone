"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmWelcomeRead } from "@/app/_actions";
import { ActionButton } from "./ActionButton";

const WelcomeSeason = ({ userId, currentYear }) => {
  const [state, formAction] = useActionState(confirmWelcomeRead, {
    success: false,
    message: "",
  });

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-blue-100 p-6 rounded-md shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">
          Welcome to Sandsharks {currentYear} Season!
        </h1>

        {/* Display success message if confirmation was successful */}
        {state.success && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
            {state.message}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-bold text-blue-700">
            What is new for {currentYear}? A lot!
          </h2>
        </div>

        {/* Permits Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2">Permits</h2>
          <p className="mb-2">
            We officially have our own permits to reserve courts this Summer! I
            got us a pretty sweet spot near the trees around court 91 to call
            our homebase for most of the Summer.
          </p>
          <p className="mb-2">
            You'll get an email every week with a schedule for the upcoming
            weekend (you can opt out of these emails anytime at
            sandsharks.ca/unsubscribe).
          </p>
          <p>
            Make sure to include this email in your safe-senders list:{" "}
            <span className="font-semibold">notifications@sandsharks.ca</span>{" "}
            to get the updates.
          </p>
        </div>

        {/* Donations Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2">Donations</h2>
          <p className="mb-2">
            This is the first year that we've had to get permits to play, so
            I'll need your help to cover the costs of the court rentals,
            insurance, equipment storage, replacing worn out equipment, website
            costs, and more.
          </p>
          <p className="mb-2">
            I've added a link on the website to make a donation to Sandsharks.
            The donations are pay-what-you-can, with a suggested amount of
            $40/player for the entire Summer.
          </p>
          <p className="mb-4">
            Please donate as soon as you can - I've had to pay for everything
            upfront, and it ain't cheap.
          </p>
          <div className="flex justify-start">
            <Link href="/dashboard/member/donations">
              <ActionButton className="bg-[#e376f1] hover:bg-[#d65ee3] text-white">
                DONATE NOW
              </ActionButton>
            </Link>
          </div>
        </div>

        {/* Volunteering Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2">Volunteering</h2>
          <p className="mb-2">
            Now that we have permits, and a storage locker near the beach for
            the equipment, I am hoping that this will encourage some of you
            long-time Sandsharks and some of you new enthusiastic Sharks to
            volunteer to set things up for a day or two during the Summer.
          </p>
          <p className="mb-2">
            I'm hoping to have 2 volunteers (myself being the default volunteer)
            every day we play, so you can sign up by yourself or with a friend!
          </p>
          <p className="mb-4">
            It'll be easier than ever and I'll teach you everything you need to
            know to run a fun day of beach volleyball!
          </p>
          <div className="flex justify-start">
            <Link href="/dashboard/member/volunteering">
              <ActionButton className="bg-[#e376f1] hover:bg-[#d65ee3] text-white">
                SIGN UP TO VOLUNTEER
              </ActionButton>
            </Link>
          </div>
        </div>

        {/* Sponsorships Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2">Sponsorships</h2>
          <p className="mb-2">
            This being the first year we've had large costs associated with
            running Sandsharks, I'd still like to seek out sponsorships from
            members within the league who run a business to help support the
            costs of running Sandsharks. If there is enough interest in
            sponsorships, this will help establish how we can cover costs in
            future seasons.
          </p>
          <p className="mb-2">
            Sponsors are asked to cover the costs of running Sandsharks for one
            of the days we're playing ($200). As a thank you, I'll include your
            logo, links to your website and social media, and a description of
            your company on the day you're sponsoring, and in all email
            communications for that day to our 300+ members.
          </p>
          <p className="mb-4">
            It's a great way to show your support while advertising your
            business and I'm hoping it'll encourage our members to support
            fellow Sharks' businesses.
          </p>
          <div className="flex justify-start">
            <Link href="/dashboard/member/become-a-sponsor">
              <ActionButton className="bg-[#e376f1] hover:bg-[#d65ee3] text-white">
                SIGN UP TO BECOME A SPONSOR
              </ActionButton>
            </Link>
          </div>
        </div>

        {/* Upload a Photo/Instagram Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-2">Upload a Photo/Instagram</h2>
          <p className="mb-2">
            Let's see those pretty faces! Please consider uploading a photo to
            your profile - it really helps new members get to know everyone (and
            helps me remember everybody's names haha).
          </p>
          <p className="mb-2">
            I've also added an option to share your instagram handle on your
            profile as well for those looking to connect with other players.
          </p>
          <p className="mb-2">
            I'd love to take more photos of Sandsharks throughout the Summer as
            well! It's always fun to look back at past Summers.
          </p>
          <p className="mb-2">
            I've considered setting up an Instagram account for Sandsharks to
            help members connect, but I don't personally want to be in charge of
            it, so if someone wants to volunteer to run the Sandsharks Instagram
            account, please reach out to me:{" "}
            <a
              href="mailto:sandsharks.org@gmail.com"
              className="text-blue-700 hover:text-blue-500"
            >
              sandsharks.org@gmail.com
            </a>
            .
          </p>
          <p className="mb-4">
            No pressure though, if you want to stay "discrete" I've added an
            option to opt out of being included in any photos posted on the
            Sandsharks website/social media that you can update anytime on your
            profile.
          </p>
          <div className="flex justify-start">
            <Link href="/dashboard/member/profile">
              <ActionButton className="bg-[#e376f1] hover:bg-[#d65ee3] text-white">
                UPDATE PROFILE
              </ActionButton>
            </Link>
          </div>
        </div>

        {/* Spread the Word Section */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Spread the Word</h2>
          <p className="mb-2">
            Lastly, let's get the word out that this is going to be a super fun
            season! Tell your friends and playmates to come give Sandsharks a
            try this Summer!
          </p>
        </div>

        {/* Closing */}
        <div className="mt-8 border-t border-gray-300 pt-4">
          <p className="italic">
            Thanks everyone for your support and good vibes - I'm really looking
            forward to this upcoming season,
          </p>
          <p className="font-semibold">-Cip</p>
        </div>

        {/* Confirmation Button - Remains centered */}
        {!state.success && (
          <form action={formAction} className="mt-8 text-center">
            <input type="hidden" name="userId" value={userId} />

            <button type="submit" className="btn">
              Got it!
            </button>
          </form>
        )}

        {state.success && (
          <div className="mt-8 text-center text-green-700 font-medium">
            Thanks for reading! You're all set for the {currentYear} season.
          </div>
        )}
      </div>
    </div>
  );
};

export default WelcomeSeason;
