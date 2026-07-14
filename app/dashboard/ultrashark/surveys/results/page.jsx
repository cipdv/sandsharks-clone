import { getSurveyResults } from "@/app/_actions";
import Link from "next/link";

function formatDate(value) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleString();
}

function formatAnswer(answer) {
  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer.join(", ") : "No answer";
  }

  return answer ? String(answer) : "No answer";
}

function getQuestionSummaries(questions, responses) {
  return questions.map((question) => {
    const entries = responses.map((response) => {
      const answerData = response.answers?.[question.id];
      return answerData?.answer;
    });

    if (["checkbox", "radio", "select"].includes(question.type)) {
      const counts = new Map();

      for (const entry of entries) {
        const values = Array.isArray(entry) ? entry : [entry];

        for (const value of values) {
          if (!value) continue;
          counts.set(value, (counts.get(value) || 0) + 1);
        }
      }

      return {
        question,
        type: "counts",
        counts: Array.from(counts.entries()).sort((a, b) => b[1] - a[1]),
      };
    }

    return {
      question,
      type: "text",
      answers: entries
        .map((entry) => String(entry || "").trim())
        .filter(Boolean),
    };
  });
}

export default async function SurveyResultsPage() {
  const result = await getSurveyResults();

  if (!result.success) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-100 p-4 text-red-800">
          {result.message || "Unable to load survey results."}
        </div>
      </main>
    );
  }

  const survey = result.survey;
  const responses = result.responses;
  const questions = Array.isArray(survey?.questions) ? survey.questions : [];
  const summaries = getQuestionSummaries(questions, responses);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Survey Results</h1>
          <p className="mt-1 text-gray-600">
            {survey?.title || "Current survey"} - {responses.length}{" "}
            {responses.length === 1 ? "response" : "responses"}
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
            href="/dashboard/ultrashark/surveys"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Edit Survey
          </Link>
        </div>
      </div>

      {!survey ? (
        <section className="rounded-lg bg-white p-6 shadow-md">
          <p className="text-gray-700">No survey has been created yet.</p>
        </section>
      ) : responses.length === 0 ? (
        <section className="rounded-lg bg-white p-6 shadow-md">
          <p className="text-gray-700">No responses have been submitted yet.</p>
        </section>
      ) : (
        <div className="space-y-6">
          <section className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-2xl font-bold">Question Summary</h2>
            <div className="space-y-6">
              {summaries.map((summary) => (
                <div
                  key={summary.question.id}
                  className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0"
                >
                  <h3 className="font-semibold text-gray-900">
                    {summary.question.label}
                  </h3>

                  {summary.type === "counts" ? (
                    summary.counts.length > 0 ? (
                      <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr className="border-b text-gray-600">
                              <th className="py-2 pr-4 font-medium">Answer</th>
                              <th className="py-2 font-medium">Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {summary.counts.map(([answer, count]) => (
                              <tr key={answer} className="border-b last:border-0">
                                <td className="py-2 pr-4">{answer}</td>
                                <td className="py-2">{count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-600">No answers yet.</p>
                    )
                  ) : summary.answers.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {summary.answers.map((answer, index) => (
                        <li
                          key={`${summary.question.id}-${index}`}
                          className="rounded-md bg-gray-50 p-3 text-sm text-gray-800"
                        >
                          {answer}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">No answers yet.</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-2xl font-bold">Individual Responses</h2>
            <div className="space-y-4">
              {responses.map((response) => (
                <article
                  key={response.id}
                  className="rounded-md border border-gray-200 p-4"
                >
                  <div className="mb-4 flex flex-col gap-1 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {response.memberFirstName} {response.memberLastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {response.memberEmail}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(response.createdAt)}
                    </p>
                  </div>

                  <dl className="space-y-3">
                    {questions.map((question) => (
                      <div key={question.id}>
                        <dt className="text-sm font-medium text-gray-900">
                          {question.label}
                        </dt>
                        <dd className="mt-1 text-sm text-gray-700">
                          {formatAnswer(response.answers?.[question.id]?.answer)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
