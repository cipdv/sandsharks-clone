import { getSurveyById, getSurveyResults } from "@/app/_actions";
import SurveyAdminForm from "@/components/SurveyAdminForm";
import SurveyResultsView from "@/components/SurveyResultsView";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function UltrasharkSurveyDetailPage({ params }) {
  const { id } = await params;
  const survey = await getSurveyById(id);

  if (!survey) {
    notFound();
  }

  const result = await getSurveyResults(id);
  const responses = result.success ? result.responses : [];

  return (
    <UltrasharkPageShell
      title={survey.title}
      description={`${survey.is_visible ? "Active and visible" : "Hidden"} - ${
        responses.length
      } ${responses.length === 1 ? "response" : "responses"}`}
      showDashboardLink={false}
      actions={
        <>
          <Link
            href="/dashboard/ultrashark/surveys"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            All Surveys
          </Link>
          {survey.is_visible ? (
            <Link
              href="/survey"
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              View Survey
            </Link>
          ) : null}
        </>
      }
    >
      <div className="space-y-6">
        <section className="rounded-lg bg-white p-6 shadow-md">
          <SurveyAdminForm survey={survey} />
        </section>

        {!result.success ? (
          <section className="rounded-md bg-red-100 p-4 text-red-800">
            {result.message || "Unable to load survey results."}
          </section>
        ) : (
          <SurveyResultsView survey={survey} responses={responses} />
        )}
      </div>
    </UltrasharkPageShell>
  );
}
