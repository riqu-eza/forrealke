"use client";

import { useUser } from "@/context/UserContext";
import { ICustomerRequest } from "@/models/CustomerRequest";
import { useEffect, useState } from "react";

export default function ManagerDashboard() {
  const [requests, setRequests] = useState<ICustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser(); // Fetch all requests
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/requests");
        const data = await res.json();
        setRequests(data);
        console.log("Fetched requests:", data);
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
        body: JSON.stringify({ requestId, userId: user?._id }),
      });
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
              key={String(req._id)}
              className="p-4 border rounded shadow-sm bg-white space-y-2"
            >
              <p>
                <strong>Yard:</strong> {req.yard.name} ({req.yard.address})
              </p>
              <p>
                <strong>Car:</strong> {req.carDetails.make}{" "}
                {req.carDetails.model} ({req.carDetails.regNo})
              </p>
              <p>
                <strong>Preferred Window:</strong>
                {new Date(req.preferredWindow.start).toLocaleString()} →
                {new Date(req.preferredWindow.end).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {req.status}
              </p>
              <p>
                <strong>Priority:</strong> {req.priority}
              </p>

              <div className="flex flex-wrap gap-2 mt-2">
               
                <button
                  className="px-3 py-1 bg-green-500 text-white rounded"
                  onClick={() => handleAction(String(req._id), "assign")}
                >
                  Assign
                </button>
                
                <button
                  className="px-3 py-1 bg-orange-500 text-white rounded"
                  onClick={() => handleAction(String(req._id), "report")}
                >
                  Report
                </button>
                <button
                  className="px-3 py-1 bg-red-500 text-white rounded"
                  onClick={() => handleAction(String(req._id), "close")}
                >
                  Close
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
