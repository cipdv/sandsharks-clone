import Link from "next/link";

const leagueHistoryPage = () => {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-2xl text-sandsharks-blue">
        This section is coming soon!
      </h1>
      <h1 className="text-2xl text-sandsharks-blue">Check back later :)</h1>
      <div className="mt-4">
        <Link href="/dashboard/member">
          <button className="btn">Return to dashboard</button>
        </Link>
      </div>
    </div>
  );
};

export default leagueHistoryPage;
