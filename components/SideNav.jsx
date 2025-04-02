import Link from "next/link";

const SideNav = () => {
  return (
    <div>
      <Link href="/dashboard/member/league-history">
        <div className="pl-2 pt-6 pb-6 hover:bg-gray-200  border-b border-sandsharks-blue">
          <h1 className="cursor-pointer">
            Learn more about the history of Sandsharks
          </h1>
        </div>
      </Link>
      <Link href="/dashboard/member/rules">
        <div className="pl-2 pt-6 pb-6 hover:bg-gray-200  border-b border-sandsharks-blue">
          <h1 className="cursor-pointer">Learn the rules of the game</h1>
        </div>
      </Link>
      <Link href="/dashboard/member/members">
        <div className="pl-2 pt-6 pb-6 hover:bg-gray-200  border-b border-sandsharks-blue">
          <h1 className="cursor-pointer">Get to know our members</h1>
        </div>
      </Link>
      <Link href="/dashboard/member/profile">
        <div className="pl-2 pt-6 pb-6 hover:bg-gray-200  border-b border-sandsharks-blue">
          <h1 className="cursor-pointer">
            Update your profile - tell us about yourself :D
          </h1>
        </div>
      </Link>
      <Link href="/dashboard/member/donations">
        <div className="pl-2 pt-6 pb-6 hover:bg-gray-200 ">
          <h1 className="cursor-pointer">Volunteering & Donations</h1>
        </div>
      </Link>
    </div>
  );
};

export default SideNav;
