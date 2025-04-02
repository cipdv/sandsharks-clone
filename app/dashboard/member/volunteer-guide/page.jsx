export default async function VolunteerGuidePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Volunteer Guide</h1>

      <div className="space-y-8">
        {/* Storage and Equipment Access */}
        <section className="bg-blue-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            Storage and Equipment Access
          </h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Storage Address:</span> TBD
            </p>
            <p>
              <span className="font-medium">Access Number:</span> TBD
            </p>
            <p>
              <span className="font-medium">Locker Number:</span> TBD
              (directions to get to it)
            </p>
            <p>
              <span className="font-medium">Lock Combination:</span> TBD
            </p>
            <p>
              <span className="font-medium">Locking Up:</span> Make sure to lock
              up on your way out. TBD
            </p>
          </div>
        </section>

        {/* Pre-Game Setup */}
        <section className="bg-green-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-green-800">
            Pre-Game Setup
          </h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Court Information:</span> Check your
              court numbers and start time
            </p>
            <p>
              <span className="font-medium">Permits:</span> Bring a copy of
              permits
            </p>
            <p>
              <span className="font-medium">Safety Check:</span> Check the sand
              for any dangerous objects
            </p>
            <p>
              <span className="font-medium">Equipment Setup:</span> Set up nets,
              boundaries, and other equipment
            </p>
            <p>
              <span className="font-medium">Ball Inventory:</span> Count how
              many balls are in the bag before starting
            </p>
          </div>
        </section>

        {/* During Play */}
        <section className="bg-purple-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-purple-800">
            During Play
          </h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Sign-up Sheets:</span> Set out
              sign-up sheets for regular play and beginner play
            </p>
            <p>
              <span className="font-medium">Organization:</span> Try to keep
              sign-ups organized - look for empty spots to fill
            </p>
            <p>
              <span className="font-medium">New Players:</span> Help new players
              by:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Showing them how to sign up for games</li>
              <li>
                Asking if they've registered on the website and completed the
                waiver
              </li>
              <li>Helping them find games/asking people to play with them</li>
            </ul>
            <p>
              <span className="font-medium">Oversight:</span> Keep an eye on
              things between games to ensure everything runs smoothly
            </p>
            <p className="font-medium text-purple-700">Have fun!</p>
          </div>
        </section>

        {/* Personal Preparation */}
        <section className="bg-yellow-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-yellow-800">
            Personal Preparation
          </h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Supplies:</span> Make sure you have:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Plenty of water</li>
              <li>Sunscreen</li>
              <li>Shade (hat, umbrella, etc.)</li>
            </ul>
            <p>
              <span className="font-medium">First Aid:</span> Check first aid
              kit for supplies - TBD
            </p>
          </div>
        </section>

        {/* End of Day */}
        <section className="bg-red-50 p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-red-800">
            End of Day
          </h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium">Equipment:</span> Pack up all
              equipment
            </p>
            <p>
              <span className="font-medium">Ball Count:</span> Count the balls
              to ensure none are missing
            </p>
            <p>
              <span className="font-medium">Help:</span> Ask others to help with
              packing up
            </p>
            <p>
              <span className="font-medium">Storage:</span> Return everything to
              the storage locker
            </p>
            <p>
              <span className="font-medium">Security:</span> Make sure to enter
              the combo on the way out
            </p>
          </div>
        </section>
      </div>

      <div className="mt-8 p-4 bg-blue-100 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Notes</h3>
        <p>
          This guide will be updated as more information becomes available. If
          you have any questions or suggestions, please contact
          sandsharks.org@gmail.com.
        </p>
      </div>
    </div>
  );
}
