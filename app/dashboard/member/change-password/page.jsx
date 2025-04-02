import { getCurrentUser } from "@/app/_actions";
import PasswordChangeForm from "@/components/PasswordChangeForm";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Change Password</h1>
      <PasswordChangeForm user={user} />
    </div>
  );
}
