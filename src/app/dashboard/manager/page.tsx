"use client";

import { useUser } from "@/context/UserContext";
import { ICustomerRequest } from "@/models/CustomerRequest";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ManagerDashboard() {
  const [requests, setRequests] = useState<ICustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user } = useUser();

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

  const handleAction = async (requestId: string, action: string) => {
    try {
      setActionLoading(requestId + action);
      const res = await fetch(`/api/automations/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, userId: user?._id }),
      });
      const data = await res.json();
      console.log(`${action} result:`, data);

      const refreshed = await fetch("/api/requests");
      const refreshedData = await refreshed.json();
      setRequests(refreshedData);
    } catch (err) {
      console.error(`Error performing ${action}`, err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 text-black">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Service Manager Dashboard</h1>

        <Link href="/technicians/create" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded shadow">
          Create Technician
        </Link>
      </div>

      {loading ? (
        <p>Loading requests...</p>
      ) : requests.length === 0 ? (
        <p>No service requests yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {requests.map((req) => (
            <div key={String(req._id)} className="p-5 rounded-xl shadow-md border bg-white hover:shadow-lg transition-all space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{req.carDetails.make} {req.carDetails.model}</h2>
                <span className="text-sm px-2 py-1 rounded bg-gray-100">{req.status}</span>
              </div>

              <p className="text-gray-700 text-sm"><strong>Yard:</strong> {req.yard.name} ({req.yard.address})</p>
              <p className="text-gray-700 text-sm"><strong>Car Reg:</strong> {req.carDetails.regNo}</p>
              <p className="text-gray-700 text-sm"><strong>Preferred Window:</strong><br />
                {new Date(req.preferredWindow.start).toLocaleString()} → {new Date(req.preferredWindow.end).toLocaleString()}
              </p>
              <p className="text-gray-700 text-sm"><strong>Priority:</strong> {req.priority}</p>

              <div className="flex flex-wrap gap-3 mt-3">
                <button
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 transition text-white rounded shadow disabled:opacity-50"
                  onClick={() => handleAction(String(req._id), "assign")}
                  disabled={actionLoading === req._id + "assign"}
                >
                  {actionLoading === req._id + "assign" ? "Assigning..." : "Assign"}
                </button>

                <button
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 transition text-white rounded shadow disabled:opacity-50"
                  onClick={() => handleAction(String(req._id), "close")}
                  disabled={actionLoading === req._id + "close"}
                >
                  {actionLoading === req._id + "close" ? "Closing..." : "Close"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
