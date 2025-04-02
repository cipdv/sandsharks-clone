import { getCurrentUser } from "@/app/_actions";
import DeleteAccountForm from "@/components/DeleteAccountForm";

export default async function DeleteAccountPage() {
  const user = await getCurrentUser();

  return (
    <div className="container mx-auto py-8 px-4">
      <DeleteAccountForm user={user} standalone={true} />
    </div>
  );
}
