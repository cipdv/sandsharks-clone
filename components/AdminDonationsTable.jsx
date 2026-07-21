"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createExpense,
  deleteExpense,
  updateExpense,
} from "@/app/_actions";

const EXPENSE_CATEGORIES = [
  "permits",
  "insurance",
  "storage",
  "equipment repairs",
  "new equipment",
  "bike maintenance",
  "food & drinks",
  "website costs",
  "other",
];

const EMPTY_FORM = {
  id: "",
  category: "permits",
  amount: "",
  vendor: "",
  expenseDate: new Date().toISOString().slice(0, 10),
  description: "",
};

function getYear(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 4);
  }

  return String(date.getFullYear());
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });
}

function formatCategory(category) {
  return String(category || "")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getExpenseDateForInput(expense) {
  return String(expense?.expense_date || new Date().toISOString()).slice(0, 10);
}

export default function AdminDonationsTable({
  donations = [],
  expenses = [],
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const currentYear = String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState("");

  const yearOptions = useMemo(() => {
    const years = Array.from(
      new Set(
        [
          ...donations.map((donation) => getYear(donation.created_at)),
          ...expenses.map((expense) => getYear(expense.expense_date)),
        ].filter((year) => /^\d{4}$/.test(year)),
      ),
    ).sort((a, b) => Number(b) - Number(a));

    return years.includes(currentYear) ? years : [currentYear, ...years];
  }, [donations, expenses, currentYear]);

  const filteredDonations = useMemo(
    () =>
      donations.filter((donation) => getYear(donation.created_at) === selectedYear),
    [donations, selectedYear],
  );

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => getYear(expense.expense_date) === selectedYear),
    [expenses, selectedYear],
  );

  const totalDonations = filteredDonations.reduce(
    (sum, donation) => sum + Number(donation.amount || 0),
    0,
  );
  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );
  const balance = totalDonations - totalExpenses;
  const isEditing = Boolean(form.id);

  function updateForm(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function resetForm() {
    setForm({ ...EMPTY_FORM, expenseDate: new Date().toISOString().slice(0, 10) });
  }

  function handleEdit(expense) {
    setMessage("");
    setForm({
      id: String(expense.id),
      category: expense.category || "other",
      amount: String(Number(expense.amount || 0).toFixed(2)),
      vendor: expense.vendor || "",
      expenseDate: getExpenseDateForInput(expense),
      description: expense.description || "",
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData();
    formData.set("category", form.category);
    formData.set("amount", form.amount);
    formData.set("vendor", form.vendor);
    formData.set("expenseDate", form.expenseDate);
    formData.set("description", form.description);

    if (isEditing) {
      formData.set("id", form.id);
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateExpense(formData)
        : await createExpense(formData);

      setMessage(result.message || "");

      if (result.success) {
        resetForm();
        router.refresh();
      }
    });
  }

  function handleDelete(expenseId) {
    setMessage("");

    startTransition(async () => {
      const result = await deleteExpense(expenseId);
      setMessage(result.message || "");

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <>
      <div className="mb-6 max-w-xs">
        <label
          htmlFor="donationYear"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Year
        </label>
        <select
          id="donationYear"
          value={selectedYear}
          onChange={(event) => setSelectedYear(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          {yearOptions.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">
            Donations in {selectedYear}
          </h2>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(totalDonations)}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">
            Expenses in {selectedYear}
          </h2>
          <p className="text-3xl font-bold text-red-600">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">
            Surplus / Loss
          </h2>
          <p
            className={`text-3xl font-bold ${
              balance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(balance)}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">
            Donation Count
          </h2>
          <p className="text-3xl font-bold text-blue-600">
            {filteredDonations.length}
          </p>
        </div>
      </div>

      <section className="mb-8 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? "Edit Expense" : "Add Expense"}
          </h2>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="self-start rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel edit
            </button>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 lg:grid-cols-6"
        >
          <div className="lg:col-span-2">
            <label
              htmlFor="expenseCategory"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="expenseCategory"
              value={form.category}
              onChange={(event) => updateForm("category", event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="expenseAmount"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Amount
            </label>
            <input
              id="expenseAmount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => updateForm("amount", event.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="expenseDate"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <input
              id="expenseDate"
              type="date"
              value={form.expenseDate}
              onChange={(event) => updateForm("expenseDate", event.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="expenseVendor"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Vendor
            </label>
            <input
              id="expenseVendor"
              type="text"
              value={form.vendor}
              onChange={(event) => updateForm("vendor", event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div className="lg:col-span-5">
            <label
              htmlFor="expenseDescription"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Notes
            </label>
            <input
              id="expenseDescription"
              type="text"
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Update expense"
                  : "Add expense"}
            </button>
          </div>
        </form>

        {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          Expenses in {selectedYear}
        </h2>
        {filteredExpenses.length === 0 ? (
          <p className="text-gray-600">No expenses have been recorded in {selectedYear}.</p>
        ) : (
          <div className="overflow-x-auto rounded-md bg-blue-100 p-4">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Category
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Vendor
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Notes
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {new Date(expense.expense_date).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {formatCategory(expense.category)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {expense.vendor || "-"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {expense.description || "-"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => handleEdit(expense)}
                        className="mr-2 rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(expense.id)}
                        disabled={isPending}
                        className="rounded-md border border-red-300 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-gray-900">
          Donations in {selectedYear}
        </h2>
        {filteredDonations.length === 0 ? (
          <p className="text-gray-600">No donations were made in {selectedYear}.</p>
        ) : (
          <div className="overflow-x-auto rounded-md bg-blue-100 p-4">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Member
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Amount
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDonations.map((donation) => (
                  <tr key={donation.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {donation.first_name} {donation.last_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      {formatCurrency(donation.amount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          donation.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {donation.status || "completed"}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-900">
                      {donation.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
