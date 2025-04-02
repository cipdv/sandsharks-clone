import { getAllMembers } from "@/app/_actions";
import USMemberManagement from "@/components/USMemberManagement";
import USPendingMembers from "@/components/USPendingMembers";
import USPendingPhotos from "@/components/USPendingPhotos";

const USMembersPage = async () => {
  const members = await getAllMembers();

  // Check if there was an error fetching members
  if (members?.error || members?.message) {
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-md">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{members.error || members.message}</p>
      </div>
    );
  }

  // Filter members by status for different components
  const pendingMembers = members.filter(
    (member) => member.memberType === "pending"
  );
  const pendingPhotoMembers = members.filter(
    (member) => member.profilePicStatus === "pending" && member.profilePicUrl
  );
  const activeMembers = members.filter(
    (member) => member.memberType !== "pending"
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <h1 className="text-3xl font-bold mb-6">Member Management</h1>

      {pendingMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Pending Members</h2>
          <USPendingMembers members={pendingMembers} />
        </div>
      )}

      {pendingPhotoMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Pending Profile Photos</h2>
          <USPendingPhotos members={pendingPhotoMembers} />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">All Members</h2>
        <USMemberManagement members={activeMembers} />
      </div>
    </div>
  );
};

export default USMembersPage;
