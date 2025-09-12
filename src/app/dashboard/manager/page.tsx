"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";

interface CustomerRequest {
  _id: string;
  serviceType: string;
  description: string;
  status: string;
  quote?: {
    amount: number;
    currency: string;
    details: string;
    approved: boolean;
  };
  history: { action: string; timestamp: string }[];
  createdAt: string;
}

export default function ManagerDashboard() {
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
 const { user } = useUser();  // Fetch all requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/requests");
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        console.error("Error fetching requests", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // Trigger automation action
  const handleAction = async (requestId: string, action: string) => {
    try {
      const res = await fetch(`/api/automations/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, userId: user?._id }),      });
      const data = await res.json();
      console.log(`${action} result:`, data);

      // Refresh requests after action
      const refreshed = await fetch("/api/requests");
      const refreshedData = await refreshed.json();
      setRequests(refreshedData);
    } catch (err) {
      console.error(`Error performing ${action}`, err);
    }
  };

  return (
    <div className="p-6 space-y-6 text-black">
      <h1 className="text-2xl font-bold">Service Manager Dashboard</h1>
      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>No service requests yet.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="p-4 border rounded shadow-sm bg-white space-y-2"
            >
              <p>
                <strong>Type:</strong> {req.serviceType}
              </p>
              <p>
                <strong>Description:</strong> {req.description}
              </p>
              <p>
                <strong>Status:</strong> {req.status}
              </p>
              {req.quote && (
                <p>
                  <strong>Quote:</strong> {req.quote.amount} {req.quote.currency} (
                  {req.quote.approved ? "Approved" : "Pending"})
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                  onClick={() => handleAction(req._id, "triage")}
                >
                  Triage
                </button>
                <button
                  className="px-3 py-1 bg-green-500 text-white rounded"
                  onClick={() => handleAction(req._id, "assign")}
                >
                  Assign
                </button>
                <button
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
                  onClick={() => handleAction(req._id, "schedule")}
                >
                  Schedule
                </button>
                <button
                  className="px-3 py-1 bg-orange-500 text-white rounded"
                  onClick={() => handleAction(req._id, "approveQuote")}
                >
                  Approve Quote
                </button>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded"
                  onClick={() => handleAction(req._id, "closeJob")}
                >
                  Close Job
                </button>
              </div>
              {req.history.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  <strong>History:</strong>
                  <ul className="list-disc ml-5">
                    {req.history.map((h, i) => (
                      <li key={i}>
                        {h.action} - {new Date(h.timestamp).toLocaleString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
