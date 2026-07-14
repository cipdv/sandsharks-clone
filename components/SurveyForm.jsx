"use client";

import { useActionState } from "react";
import { submitSurvey } from "@/app/_actions";

const initialState = {
  success: false,
  message: "",
};

function SubmitButton({ isPending }) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-400"
    >
      {isPending ? "Submitting..." : "Submit Survey"}
    </button>
  );
}

function SurveyQuestion({ question }) {
  const fieldName = `answer-${question.id}`;
  const inputClass =
    "w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500";

  return (
    <fieldset className="space-y-2">
      <legend className="block text-sm font-medium text-gray-900">
        {question.label}
        {question.required && <span className="text-red-600"> *</span>}
      </legend>

      {question.type === "textarea" && (
        <textarea
          name={fieldName}
          rows={4}
          required={question.required}
          className={inputClass}
        />
      )}

      {question.type === "text" && (
        <input
          type="text"
          name={fieldName}
          required={question.required}
          className={inputClass}
        />
      )}

      {question.type === "select" && (
        <select
          name={fieldName}
          required={question.required}
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>
            Select an option
          </option>
          {question.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )}

      {question.type === "radio" && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={fieldName}
                value={option}
                required={question.required}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === "checkbox" && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={fieldName} value={option} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

export default function SurveyForm({ survey }) {
  const [state, formAction, isPending] = useActionState(
    submitSurvey,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      {survey.questions.map((question) => (
        <SurveyQuestion key={question.id} question={question} />
      ))}

      <SubmitButton isPending={isPending} />

      {state?.message && (
        <div
          className={`rounded-md p-3 ${
            state.success
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {state.message}
        </div>
      )}
    </form>
  );
}
