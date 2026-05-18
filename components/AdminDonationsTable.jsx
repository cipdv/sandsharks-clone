"use client";

import { useMemo, useState } from "react";

function getDonationYear(donation) {
  const dateValue = donation?.created_at;
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return String(dateValue).slice(0, 4);
  }

  return String(date.getFullYear());
}

export default function AdminDonationsTable({ donations = [] }) {
  const currentYear = String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const donationYears = useMemo(() => {
    const years = Array.from(
      new Set(
        donations
          .map((donation) => getDonationYear(donation))
          .filter((year) => /^\d{4}$/.test(year)),
      ),
    ).sort((a, b) => Number(b) - Number(a));

    return years.includes(currentYear) ? years : [currentYear, ...years];
  }, [donations, currentYear]);

  const filteredDonations = useMemo(
    () =>
      donations.filter((donation) => getDonationYear(donation) === selectedYear),
    [donations, selectedYear],
  );

  const totalDonations = filteredDonations.reduce(
    (sum, donation) => sum + Number(donation.amount),
    0,
  );

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
          {donationYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">
            Total Donations in {selectedYear}
          </h2>
          <p className="text-3xl font-bold text-blue-600">
            ${totalDonations.toFixed(2)}
          </p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700">
            Number of Donations in {selectedYear}
          </h2>
          <p className="text-3xl font-bold text-blue-600">
            {filteredDonations.length}
          </p>
        </div>
      </div>

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
                    ${Number.parseFloat(donation.amount).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        donation.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {donation.status}
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
    </>
  );
}
