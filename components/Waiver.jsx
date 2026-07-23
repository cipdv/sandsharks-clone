"use client";

import { confirmWaiver } from "@/app/_actions";
import { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="btn mt-4 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
      type="submit"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? "Submitting..." : "I agree"}
    </button>
  );
}

const codeOfConductItems = [
  "I will treat all members of the group with respect and kindness.",
  "I will be welcoming to new players of all skill levels and help them in any way that I can to be part of the group.",
  "I will be careful with my language and comments to avoid making others feel uncomfortable or unwelcome.",
  "I will play to have fun and do my best to keep my cool during games.",
];

const Waiver = () => {
  const [checkedItems, setCheckedItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const allItemsChecked = checkedItems.length === codeOfConductItems.length;

  function toggleItem(index) {
    setCheckedItems((currentItems) =>
      currentItems.includes(index)
        ? currentItems.filter((itemIndex) => itemIndex !== index)
        : [...currentItems, index],
    );
  }

  function handleSubmit(event) {
    if (!allItemsChecked) {
      event.preventDefault();
      setError(
        "You must agree to each code of conduct item before continuing.",
      );
      return;
    }

    setError("");
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form
        action={confirmWaiver}
        onSubmit={handleSubmit}
        className="bg-blue-100 p-4 rounded-md"
      >
        <h1 className="mb-8 text-2xl font-bold">
          To continue, please read and agree to the code of conduct:
        </h1>

        {/* Code of Conduct section */}
        <div>
          <h2 className="mt-4 font-bold">Code of Conduct</h2>
          <p className="mt-4">
            Sandsharks is organized to be fun, safe, and welcoming to all LGBTQ+
            people. We will not tolerate discrimination, hate speech, verbal or
            physical harrassment of any kind. Our goal is to have fun in a
            friendly competitive setting.
          </p>
          <br />
          <p>
            To be a Sandshark, read this oath and keep it in mind while playing
            with us:
          </p>
          <ul className="mt-4 space-y-3 font-bold">
            {codeOfConductItems.map((item, index) => (
              <li key={item}>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={checkedItems.includes(index)}
                    onChange={() => toggleItem(index)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
          <br />
          <p>
            If you feel that someone is making you uncomfortable with their
            words or actions, you don't need to put up with it; please let Cip
            know either in person or by{" "}
            <a
              href="mailto:info@sandsharks.org"
              className="text-blue-700 hover:text-blue-500"
            >
              email
            </a>
            .
          </p>
        </div>

        {error ? (
          <div className="mt-4 rounded-md bg-red-100 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
};

export default Waiver;
