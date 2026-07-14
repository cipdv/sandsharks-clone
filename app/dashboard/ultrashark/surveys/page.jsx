import { getCurrentSurvey } from "@/app/_actions";
import SurveyAdminForm from "@/components/SurveyAdminForm";
import Link from "next/link";

export default async function UltrasharkSurveysPage() {
  const survey = await getCurrentSurvey();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Survey Settings</h1>
          <p className="mt-1 text-gray-600">
            Edit the current member survey and control whether it is visible.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/survey"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            View Survey
          </Link>
          <Link
            href="/dashboard/ultrashark/surveys/results"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            View Results
          </Link>
        </div>
      </div>

      <section className="rounded-lg bg-white p-6 shadow-md">
        <SurveyAdminForm survey={survey} />
      </section>
    </main>
  );
}
