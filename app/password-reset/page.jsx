"use client"
import { useActionState } from "react"
import { sendPasswordReset } from "@/app/_actions"
import { useRouter } from "next/navigation"
import { ActionButton } from "@/components/ActionButton"

const initialState = {
  message: "",
  error: "",
}

const passwordResetPage = () => {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(sendPasswordReset, initialState)

  const navigateToSignIn = () => {
    router.push("/signin")
  }

  return (
    <section>
      <form
        action={formAction}
        className="bg-blue-100 p-4 rounded-md mt-6 w-full sm:w-4/5 md:w-3/5 lg:w-2/5 xl:w-1/3 mx-auto max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4">Reset your password</h1>
        <label>Enter the email you registered with:</label>
        <input type="email" placeholder="Email" name="email" required className="block mt-4 mb-4 p-2" />
        {state?.message ? (
          <>
            <h1 className="text-sandsharks-blue mb-4">{state?.message}</h1>
            <ActionButton onClick={navigateToSignIn} className="mt-2">
              Click here to sign in
            </ActionButton>
          </>
        ) : (
          <>
            {state?.error && <h1 className="text-red-500">{state?.error}</h1>}
            <ActionButton className="mt-4">Send Reset Email</ActionButton>
          </>
        )}
      </form>
    </section>
  )
}

export default passwordResetPage


