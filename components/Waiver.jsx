"use client";

import { confirmWaiver } from "@/app/_actions";
import { useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="btn mt-4 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      type="submit"
      aria-disabled={pending}
    >
      {pending ? "Submitting..." : "I agree"}
    </button>
  );
}

const Waiver = () => {
  const [waiverAgreement, setWaiverAgreement] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form action={confirmWaiver} className="bg-blue-100 p-4 rounded-md">
        <h1 className="mb-8 text-2xl font-bold">
          To continue, please read and agree to the liability waiver and code of
          conduct:
        </h1>

        {/* Code of Conduct section */}
        <div>
          <h2 className="mt-4 font-bold">Code of Conduct</h2>
          <p className="mt-4">
            Sandsharks is organized to be fun, safe, and welcoming to all LGBTQ+
            people. We will not tolerate discrimination, hate speech, verbal or
            physical harrassment of any kind. Our goal is to have fun in a
            friendly competitive setting.
          </p>
          <br />
          <p>
            To be a Sandshark, read this oath and keep it in mind while playing
            with us:
          </p>
          <ul className="mt-4 font-bold ml-4 space-y-2">
            <li>
              I will treat all members of the group with respect and kindness.
            </li>
            <li>
              I will be welcoming to new players of all skill levels and help
              them in any way that I can to be part of the group.
            </li>
            <li>
              I will be careful with my language and comments to avoid making
              others feel uncomfortable or unwelcome.
            </li>
            <li>
              I will play to have fun and do my best to keep my cool during
              games.
            </li>
          </ul>
          <br />
          <p>
            If you feel that someone is making you uncomfortable with their
            words or actions, you don't need to put up with it; please let Cip
            know either in person or by{" "}
            <a
              href="mailto:info@sandsharks.org"
              className="text-blue-700 hover:text-blue-500"
            >
              email
            </a>
            .
          </p>
        </div>

        {/* Liability Waiver section */}
        <div>
          <h2 className="mt-4 font-bold">Liability Waiver</h2>
          <p className="mt-4">
            By clicking agree,{" "}
            <b>
              I hereby release and forever discharge Toronto SandSharks, its
              players, organizers, and agents, from all liabilities, actions,
              cause of actions, claims, demands for damages, loss or personal
              injuries,{" "}
            </b>
            however so arising and including, but not limited to injuries
            arising from the negligence of Toronto SandSharks, its players,
            organizers, and agents which hereto may have been or may hereafter
            be sustained by me in consequence of my participation.
          </p>
          <br />
          <p>
            I acknowledge that no warranties or conditions are made, expressed
            or implied, that activities have been, are, or will be conducted so
            as to prevent or minimize the risk of personal injury. I acknowledge
            that I am solely responsible for inspecting and clearing my own
            court and surrounding area of potential hazards, securing my own
            belongings, and preventing injury to myself and to others. I
            acknowledge that Toronto SandSharks makes no representation
            whatsoever as to the competence or ability of its players to
            participate in the league activities in a safe manner.
          </p>
          <br />
          <p>
            I further acknowledge that I voluntarily assume all risk of personal
            injury from participation, and that I have taken appropriate
            measures to make myself aware of all risks involved in the
            performance of such activities prior to signing this Waiver. I fully
            understand, having read the above, that the nature and effect of
            this document is to release Toronto SandSharks, its players,
            organizers, and agents, from all liability.
          </p>
        </div>

        {/* Privacy Policy section */}
        <div>
          <h2 className="mt-4 font-bold">Privacy Policy</h2>
          <p className="mt-4">
            Toronto SandSharks is committed to protecting your privacy. The only
            information visible to other members on the website will be your
            first name and pronouns, and if you choose to include a photo and
            whatever information you include in your "about me" section. We will
            only use your personal information to contact you about league
            events and to run the league. We will never sell your information to
            third parties. The website uses cookies solely for the purpose of
            maintaining your login session. By continuing to use the site, you
            agree to the use of cookies.
          </p>
          <p className="mt-4">
            By clicking agree,{" "}
            <b>
              I agree that Toronto SandSharks may collect and store my personal
              information for the purposes of running the league and contacting
              me about league events.
            </b>
          </p>
        </div>

        {/* Photo Consent Policy section */}
        <div>
          <h2 className="mt-4 font-bold">Photo Consent Policy</h2>
          <p className="mt-4">
            Sometimes we take photos during Sandsharks events. Some photos may
            be used on our website and social media accounts. By checking the
            photo consent policy below, you are agreeing to allow Sandsharks to
            use photos that you are in for these purposes. You can revoke your
            consent at anytime by logging in to sandsharks.ca and updating your
            preferences in your profile.
          </p>
          <p className="mt-4">
            If you find a photo that you are in and haven't given consent,
            please notify us at sandsharks.org@gmail.com so that we can remove
            the photo.
          </p>
        </div>

        {/* Checkboxes section */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="photoConsent"
              name="photoConsent"
              defaultChecked={true}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="photoConsent"
              className="ml-2 block text-sm font-medium"
            >
              I agree to the photo consent policy. Photos taken during
              Sandsharks events may be used on the website and social media.
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="waiverAgreement"
              name="waiverAgreement"
              checked={waiverAgreement}
              onChange={(e) => setWaiverAgreement(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              required
            />
            <label
              htmlFor="waiverAgreement"
              className="ml-2 block text-sm font-medium"
            >
              I have read and agree to the waiver and code of conduct policies.{" "}
              <span className="text-red-500">*</span>
            </label>
          </div>
        </div>

        <div className="mt-4">
          <button
            className="btn mt-4 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={!waiverAgreement}
          >
            {useFormStatus().pending ? "Submitting..." : "I agree"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Waiver;
