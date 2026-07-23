import {
  getPlayDays,
  getVolunteerRequests,
  getSponsorRequests,
  getActiveSurveyCount,
  getAllDonations,
  getAllExpenses,
  getAllMembers,
  getUltrasharkEvents,
} from "@/app/_actions";
import Link from "next/link";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";

function formatScheduleDate(playDay) {
  if (!playDay?.date) return "No date set";

  const date = new Date(`${playDay.date}T${playDay.startTime || "00:00"}`);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: playDay.startTime ? "numeric" : undefined,
    minute: playDay.startTime ? "2-digit" : undefined,
  }).format(date);
}

function getVolunteerNames(playDay) {
  const volunteers = [];

  if (playDay?.mainVolunteer) {
    volunteers.push(
      `${playDay.mainVolunteer.first_name} ${playDay.mainVolunteer.last_name}`,
    );
  }

  if (playDay?.helperVolunteer) {
    volunteers.push(
      `${playDay.helperVolunteer.first_name} ${playDay.helperVolunteer.last_name}`,
    );
  }

  return volunteers;
}

function getYear(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 4);
  }

  return String(date.getFullYear());
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });
}

export default async function AdminDashboard() {
  const playDays = await getPlayDays();
  const volunteerRequestsResult = await getVolunteerRequests();
  const sponsorRequestsResult = await getSponsorRequests();
  const activeSurveyCount = await getActiveSurveyCount();
  const [donations, expenses, allMembers, eventsResult] = await Promise.all([
    getAllDonations(),
    getAllExpenses(),
    getAllMembers(),
    getUltrasharkEvents(),
  ]);
  const pendingMemberCount = Array.isArray(allMembers)
    ? allMembers.filter((member) => member.memberType === "pending").length
    : 0;
  const pendingProfilePhotoCount = Array.isArray(allMembers)
    ? allMembers.filter(
        (member) =>
          member.profilePicStatus === "pending" && member.profilePicUrl,
      ).length
    : 0;
  const pendingVolunteerRequestCount = volunteerRequestsResult.success
    ? volunteerRequestsResult.requests.length
    : 0;
  const pendingSponsorRequestCount = sponsorRequestsResult.success
    ? sponsorRequestsResult.requests.length
    : 0;
  const currentYear = String(new Date().getFullYear());
  const donationTotal = donations
    .filter((donation) => getYear(donation.created_at) === currentYear)
    .reduce((sum, donation) => sum + Number(donation.amount || 0), 0);
  const expenseTotal = expenses
    .filter((expense) => getYear(expense.expense_date) === currentYear)
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const netIncome = donationTotal - expenseTotal;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextPlayDay = [...playDays]
    .filter((playDay) => {
      if (!playDay.date || playDay.is_cancelled) return false;
      return new Date(`${playDay.date}T00:00:00`) >= today;
    })
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.startTime || "00:00"}`) -
        new Date(`${b.date}T${b.startTime || "00:00"}`),
    )[0];
  const nextPlayDayVolunteers = getVolunteerNames(nextPlayDay);
  const beginnerClinicRsvpCount =
    nextPlayDay?.beginnerClinic?.beginnerClinicReplies?.length || 0;
  const upcomingEventCount = eventsResult.success
    ? eventsResult.events.filter((event) => {
        if (!event.eventDate) return false;
        return new Date(`${event.eventDate}T00:00:00`) >= today;
      }).length
    : 0;

  return (
    <UltrasharkPageShell title="Admin Dashboard" showDashboardLink={false}>
      <div className="mb-6 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex h-full flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Schedule</h2>
              {nextPlayDay ? (
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>Next play date is {formatScheduleDate(nextPlayDay)}</p>
                  <p>
                    {nextPlayDay.replies?.length || 0}{" "}
                    {(nextPlayDay.replies?.length || 0) === 1
                      ? "RSVP"
                      : "RSVPs"}
                  </p>
                  {nextPlayDay.hasClinic && nextPlayDay.beginnerClinic ? (
                    <p>
                      Beginner clinic: {beginnerClinicRsvpCount}{" "}
                      {beginnerClinicRsvpCount === 1 ? "RSVP" : "RSVPs"}
                    </p>
                  ) : null}
                  <p>
                    Volunteers:{" "}
                    {nextPlayDayVolunteers.length > 0
                      ? nextPlayDayVolunteers.join(", ")
                      : "Unassigned"}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-600">
                  No upcoming play days scheduled
                </p>
              )}
            </div>
            <Link
              href="/dashboard/ultrashark/schedule"
              className="mt-auto inline-flex w-fit justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              manage schedule
            </Link>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex h-full flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Events</h2>
              <p className="mt-2 text-sm text-gray-600">
                {upcomingEventCount} upcoming{" "}
                {upcomingEventCount === 1 ? "event" : "events"}
              </p>
            </div>
            <Link
              href="/dashboard/ultrashark/events"
              className="mt-auto inline-flex w-fit justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Manage events
            </Link>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex h-full flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Emails</h2>
            </div>
            <Link
              href="/dashboard/ultrashark/email"
              className="mt-auto inline-flex w-fit justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Send email
            </Link>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex h-full flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Members</h2>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                {pendingMemberCount > 0 ? (
                  <p className="rounded-md bg-yellow-50 px-3 py-2 text-yellow-900">
                    {pendingMemberCount} pending{" "}
                    {pendingMemberCount === 1 ? "member" : "members"}
                  </p>
                ) : null}
                {pendingVolunteerRequestCount > 0 ? (
                  <p className="rounded-md bg-yellow-50 px-3 py-2 text-yellow-900">
                    {pendingVolunteerRequestCount} pending volunteer{" "}
                    {pendingVolunteerRequestCount === 1
                      ? "request"
                      : "requests"}
                  </p>
                ) : null}
                {pendingProfilePhotoCount > 0 ? (
                  <p className="rounded-md bg-yellow-50 px-3 py-2 text-yellow-900">
                    {pendingProfilePhotoCount} pending profile{" "}
                    {pendingProfilePhotoCount === 1 ? "photo" : "photos"}
                  </p>
                ) : null}
                {pendingMemberCount === 0 &&
                pendingVolunteerRequestCount === 0 &&
                pendingProfilePhotoCount === 0 ? (
                  <p>No new member, volunteer, or profile photo requests</p>
                ) : null}
              </div>
            </div>
            <Link
              href="/dashboard/ultrashark/members"
              className="mt-auto inline-flex w-fit justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Manage members
            </Link>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex h-full flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Photo Gallery
              </h2>
            </div>
            <Link
              href="/dashboard/ultrashark/photo-gallery"
              className="mt-auto inline-flex w-fit justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Upload photos
            </Link>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex h-full flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Finances</h2>
              <dl className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex justify-between gap-4">
                  <dt>Donations this year</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCurrency(donationTotal)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Expenses this year</dt>
                  <dd className="font-medium text-gray-900">
                    {formatCurrency(expenseTotal)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-gray-100 pt-2">
                  <dt>Net income/loss</dt>
                  <dd
                    className={`font-semibold ${
                      netIncome >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {formatCurrency(netIncome)}
                  </dd>
                </div>
              </dl>
            </div>
            <Link
              href="/dashboard/ultrashark/donations"
              className="mt-auto inline-flex w-fit justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Go to finances
            </Link>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex h-full flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Surveys</h2>
              <p className="mt-2 text-sm text-gray-600">
                {activeSurveyCount} currently active
              </p>
            </div>
            <Link
              href="/dashboard/ultrashark/surveys"
              className="mt-auto inline-flex w-fit justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              manage surveys
            </Link>
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex h-full flex-col gap-5">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Sponsorship Requests
              </h2>
              <div className="mt-2 text-sm text-gray-600">
                {pendingSponsorRequestCount > 0 ? (
                  <p className="rounded-md bg-yellow-50 px-3 py-2 text-yellow-900">
                    {pendingSponsorRequestCount} new sponsorship{" "}
                    {pendingSponsorRequestCount === 1 ? "request" : "requests"}
                  </p>
                ) : (
                  <p>No new sponsorship requests</p>
                )}
              </div>
            </div>
            <Link
              href="/dashboard/ultrashark/sponsors"
              className="mt-auto inline-flex w-fit justify-center rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Manage sponsors
            </Link>
          </div>
        </section>
      </div>
    </UltrasharkPageShell>
  );
}
