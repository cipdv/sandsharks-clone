"use client";

import { useMemo, useState, useActionState } from "react";
import { saveSurveySettings } from "@/app/_actions";

const questionTypes = [
  { value: "text", label: "Short answer" },
  { value: "textarea", label: "Long answer" },
  { value: "radio", label: "Single choice" },
  { value: "checkbox", label: "Multiple choice" },
  { value: "select", label: "Dropdown" },
];

const initialState = {
  success: false,
  message: "",
};

function createQuestion(index) {
  return {
    id: `question-${Date.now()}-${index}`,
    label: "",
    type: "text",
    required: false,
    options: [],
  };
}

function hasOptions(type) {
  return ["radio", "checkbox", "select"].includes(type);
}

export default function SurveyAdminForm({ survey }) {
  const [state, formAction, isPending] = useActionState(
    saveSurveySettings,
    initialState
  );
  const [questions, setQuestions] = useState(
    Array.isArray(survey?.questions) && survey.questions.length > 0
      ? survey.questions
      : [createQuestion(1)]
  );

  const questionsJson = useMemo(() => JSON.stringify(questions), [questions]);

  function updateQuestion(index, updates) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...updates } : question
      )
    );
  }

  function updateQuestionType(index, type) {
    setQuestions((current) =>
      current.map((question, questionIndex) => {
        if (questionIndex !== index) return question;

        return {
          ...question,
          type,
          options: hasOptions(type)
            ? question.options.length > 0
              ? question.options
              : ["Yes", "No"]
            : [],
        };
      })
    );
  }

  function updateOptions(index, value) {
    updateQuestion(index, {
      options: value
        .split("\n")
        .map((option) => option.trim())
        .filter(Boolean),
    });
  }

  function removeQuestion(index) {
    setQuestions((current) =>
      current.length === 1
        ? current
        : current.filter((question, questionIndex) => questionIndex !== index)
    );
  }

  function addQuestion() {
    setQuestions((current) => [...current, createQuestion(current.length + 1)]);
  }

  return (
    <form action={formAction} className="space-y-6">
      {survey?.id ? (
        <input type="hidden" name="surveyId" value={survey.id} />
      ) : null}
      <input type="hidden" name="questionsJson" value={questionsJson} />

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium">
            Survey title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={survey?.title || "Season Survey"}
            className="w-full rounded-md border border-gray-300 p-2"
            required
          />
        </div>

        <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
          <input
            type="checkbox"
            name="isVisible"
            defaultChecked={Boolean(survey?.is_visible)}
          />
          <span>Survey visible</span>
        </label>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={survey?.description || ""}
          rows={3}
          className="w-full rounded-md border border-gray-300 p-2"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Questions</h2>
          <button
            type="button"
            onClick={addQuestion}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Add Question
          </button>
        </div>

        {questions.map((question, index) => (
          <section
            key={question.id}
            className="space-y-3 rounded-md border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-medium">Question {index + 1}</h3>
              <button
                type="button"
                onClick={() => removeQuestion(index)}
                disabled={questions.length === 1}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
              <input
                type="text"
                value={question.label}
                onChange={(event) =>
                  updateQuestion(index, { label: event.target.value })
                }
                placeholder="Question text"
                className="w-full rounded-md border border-gray-300 p-2"
                required
              />

              <select
                value={question.type}
                onChange={(event) =>
                  updateQuestionType(index, event.target.value)
                }
                className="rounded-md border border-gray-300 p-2"
              >
                {questionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(question.required)}
                  onChange={(event) =>
                    updateQuestion(index, { required: event.target.checked })
                  }
                />
                <span>Required</span>
              </label>
            </div>

            {hasOptions(question.type) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Options, one per line
                </label>
                <textarea
                  value={question.options.join("\n")}
                  onChange={(event) => updateOptions(index, event.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>
            )}
          </section>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isPending ? "Saving..." : "Save Survey"}
      </button>

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
