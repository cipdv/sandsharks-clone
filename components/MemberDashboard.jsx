"use client"

import PlayDays from "./PlayDays";
import DonationPrompt from "./DonationPrompt";
import { useEffect } from "react";

const MemberDashboard = ({ user, playDays }) => {
  const { firstName, preferredName } = user;

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="w-full sm:w-1/2 lg:w-3/4 mx-auto">
      <div className="flex justify-center w-full">
        <div className="w-full md:w-4/5 lg:w-3/4 xl:w-2/3">
          <h2 className="mb-8 text-4xl font-bold">
            Hi {preferredName || firstName}!
          </h2>

          {/* Add the donation prompt */}
          <DonationPrompt user={user} />

          <PlayDays playDays={playDays} user={user} />
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
