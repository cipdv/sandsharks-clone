import { getAllSurveys } from "@/app/_actions";
import Link from "next/link";
import UltrasharkPageShell from "@/components/UltrasharkPageShell";

function formatDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString();
}

export default async function UltrasharkSurveysPage() {
  const surveys = await getAllSurveys();

  return (
    <UltrasharkPageShell
      title="Surveys"
      description="Review active and past surveys, edit questions, and view results."
    >
      {surveys.length === 0 ? (
        <section className="rounded-lg bg-white p-6 shadow-md">
          <p className="text-gray-700">No surveys have been created yet.</p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg bg-white shadow-md">
          <ul className="divide-y divide-gray-100">
            {surveys.map((survey) => (
              <li key={survey.id}>
                <Link
                  href={`/dashboard/ultrashark/surveys/${survey.id}`}
                  className="block px-5 py-4 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {survey.title}
                        </h2>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            survey.is_visible
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {survey.is_visible ? "Active" : "Hidden"}
                        </span>
                      </div>
                      {survey.description ? (
                        <p className="mt-1 text-sm text-gray-600">
                          {survey.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>
                        {survey.responseCount}{" "}
                        {survey.responseCount === 1 ? "response" : "responses"}
                      </span>
                      <span>Updated {formatDate(survey.updated_at)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </UltrasharkPageShell>
  );
}
