import { getCurrentUser, getPlayDaysForMembers } from "@/app/_actions";
import Waiver from "@/components/Waiver";
import WelcomeSeason from "@/components/WelcomeSeason";
import MemberDashboard from "@/components/MemberDashboard";
import EmailRedirectHandler from "@/components/EmailRedirectHandler";

const MemberDash = async () => {
  const user = await getCurrentUser();
  const playDays = await getPlayDaysForMembers();
  const currentYear = new Date().getFullYear();

  // Check if waiver is valid (confirmed and not expired)
  const hasValidWaiver = isWaiverValid(user);

  // If waiver is not valid, show the waiver
  if (!hasValidWaiver) {
    return (
      <EmailRedirectHandler>
        <section>
          <Waiver isRenewal={user?.waiverConfirmed} />
        </section>
      </EmailRedirectHandler>
    );
  }

  // Check if we need to show the welcome message
  // Show if welcome_confirmed is null or from a previous year
  const needsWelcome =
    !user.welcomeConfirmed ||
    new Date(user.welcomeConfirmed).getFullYear() < currentYear;

  // If welcome message is needed, show it
  if (needsWelcome) {
    return (
      <EmailRedirectHandler>
        <section>
          <WelcomeSeason userId={user.id} currentYear={currentYear} />
        </section>
      </EmailRedirectHandler>
    );
  }

  // Otherwise, show the dashboard
  return (
    <EmailRedirectHandler>
      <section>
        <MemberDashboard user={user} playDays={playDays} />
      </section>
    </EmailRedirectHandler>
  );
};

// Updated helper function to check if waiver is valid for the current calendar year
function isWaiverValid(user) {
  if (!user?.waiverConfirmed) return false;

  if (user.waiverConfirmedAt) {
    const waiverDate = new Date(user.waiverConfirmedAt);
    const currentYear = new Date().getFullYear();

    // Check if the waiver was confirmed in the current calendar year
    return waiverDate.getFullYear() === currentYear;
  }

  return false;
}

export default MemberDash;

// import { getCurrentUser, getPlayDaysForMembers } from "@/app/_actions";
// import Waiver from "@/components/Waiver";
// import WelcomeSeason from "@/components/WelcomeSeason";
// import MemberDashboard from "@/components/MemberDashboard";

// const MemberDash = async () => {
//   const user = await getCurrentUser();
//   const playDays = await getPlayDaysForMembers();
//   const currentYear = new Date().getFullYear();

//   // Check if waiver is valid (confirmed and not expired)
//   const hasValidWaiver = isWaiverValid(user);

//   // If waiver is not valid, show the waiver
//   if (!hasValidWaiver) {
//     return (
//       <section>
//         <Waiver isRenewal={user?.waiverConfirmed} />
//       </section>
//     );
//   }

//   // Check if we need to show the welcome message
//   // Show if welcome_confirmed is null or from a previous year
//   const needsWelcome =
//     !user.welcomeConfirmed ||
//     new Date(user.welcomeConfirmed).getFullYear() < currentYear;

//   // If welcome message is needed, show it
//   if (needsWelcome) {
//     return (
//       <section>
//         <WelcomeSeason userId={user.id} currentYear={currentYear} />
//       </section>
//     );
//   }

//   // Otherwise, show the dashboard
//   return (
//     <section>
//       <MemberDashboard user={user} playDays={playDays} />
//     </section>
//   );
// };

// // Updated helper function to check if waiver is valid for the current calendar year
// function isWaiverValid(user) {
//   if (!user?.waiverConfirmed) return false;

//   if (user.waiverConfirmedAt) {
//     const waiverDate = new Date(user.waiverConfirmedAt);
//     const currentYear = new Date().getFullYear();

//     // Check if the waiver was confirmed in the current calendar year
//     return waiverDate.getFullYear() === currentYear;
//   }

//   return false;
// }

// export default MemberDash;
