import { getVisibleSurvey } from "@/app/_actions";
import { getSession } from "@/app/lib/auth";
import SurveyForm from "@/components/SurveyForm";
import { redirect } from "next/navigation";

export default async function SurveyPage() {
  const session = await getSession();

  if (!session?.resultObj) {
    redirect("/signin?redirectTo=/survey");
  }

  const survey = await getVisibleSurvey();

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-2xl rounded-md bg-blue-100 p-5 shadow-sm">
        {survey ? (
          <>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              {survey.title}
            </h1>
            {survey.description && (
              <p className="mb-6 text-gray-700">{survey.description}</p>
            )}
            <SurveyForm survey={survey} />
          </>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Surveys</h1>
            <p className="text-gray-700">
              There are no active surveys at the moment.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
