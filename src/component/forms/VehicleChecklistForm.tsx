"use client";

import { checklistTemplate } from "@/lib/checklistTemplate";
import React, { useState } from "react";

type Status = "OK" | "Needs Attention" | "Critical";

export default function VehicleChecklistForm({
  requestId, // ✅ pass this from parent (job._id or similar)
}: {
  requestId: string;
}) {
  const [responses, setResponses] = useState<
    Record<string, { status: Status; notes: string }>
  >({});
  const [activeCategory, setActiveCategory] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    item: string,
    field: "status" | "notes",
    value: Status | string
  ) => {
    setResponses((prev) => {
      const updated = {
        ...prev,
        [item]: { ...prev[item], [field]: value },
      };
      return updated;
    });
  };

  const getStatusColor = (status: Status | undefined) => {
    switch (status) {
      case "OK":
        return "bg-green-100 text-green-800 border-green-300";
      case "Needs Attention":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Critical":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const progress =
    (Object.keys(responses).length /
      checklistTemplate.reduce((acc, cat) => acc + cat.items.length, 0)) *
    100;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: {
            checklist: responses,
            submittedAt: new Date(),
          },
          status: "report_submitted",
        }),
      });

      if (!res.ok) throw new Error("Failed to submit checklist");

      const updated = await res.json();
      console.log("Checklist submitted successfully:", updated);
      alert("Checklist submitted successfully ✅");
    } catch (err) {
      console.error("Error submitting checklist:", err);
      alert("Failed to submit checklist ❌");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="md:w-64 md:sticky md:top-0 md:h-screen bg-white md:border-r border-gray-200 p-4 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800">Vehicle Checkup</h1>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(progress)}% Complete
            </p>
          </div>
        </div>

        <nav>
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
            Categories
          </h2>
          <ul className="space-y-1">
            {checklistTemplate.map((cat, i) => (
              <li key={i}>
                <button
                  onClick={() => setActiveCategory(i)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeCategory === i
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {cat.category}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Form */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {checklistTemplate[activeCategory].category}
            </h1>
            <p className="text-gray-600">
              Complete all items in this section before moving to the next
            </p>
          </div>

          <ul className="space-y-4">
            {checklistTemplate[activeCategory].items.map((item, j) => (
              <li
                key={j}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <span className="font-medium text-gray-800">{item}</span>
                  <select
                    className={`px-3 py-2 border rounded-md text-sm font-medium ${getStatusColor(
                      responses[item]?.status as Status
                    )}`}
                    value={responses[item]?.status || ""}
                    onChange={(e) =>
                      handleChange(item, "status", e.target.value as Status)
                    }
                  >
                    <option value="">Select status</option>
                    <option value="OK">OK</option>
                    <option value="Needs Attention">Needs Attention</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <textarea
                  className="mt-3 w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add notes (optional)"
                  rows={2}
                  value={responses[item]?.notes || ""}
                  onChange={(e) => handleChange(item, "notes", e.target.value)}
                />
              </li>
            ))}
          </ul>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setActiveCategory(Math.max(0, activeCategory - 1))}
              disabled={activeCategory === 0}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>

            {activeCategory < checklistTemplate.length - 1 ? (
              <button
                onClick={() => setActiveCategory(activeCategory + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next Section
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Checklist"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
