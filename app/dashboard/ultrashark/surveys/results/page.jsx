import { getCurrentSurvey } from "@/app/_actions";
import { redirect } from "next/navigation";

export default async function SurveyResultsPage() {
  const survey = await getCurrentSurvey();

  redirect(
    survey?.id
      ? `/dashboard/ultrashark/surveys/${survey.id}`
      : "/dashboard/ultrashark/surveys"
  );
}
