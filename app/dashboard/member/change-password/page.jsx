import { getCurrentUser } from "@/app/_actions";
import PasswordChangeForm from "@/components/PasswordChangeForm";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();

  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 text-center">Change Password</h1>
      <div className="w-full max-w-md">
        <PasswordChangeForm user={user} />
      </div>
    </div>
  );
}
