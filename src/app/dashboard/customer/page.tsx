"use client";

import { Button } from "@/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/component/ui/card";
import { useUser } from "@/context/UserContext";
import { ICustomerRequest } from "@/models/CustomerRequest";
import { useEffect, useState } from "react";



export default function CustomerDashboard() {
  const [requests, setRequests] = useState<ICustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ serviceType: "", description: "" });
const { user } = useUser();
  // Fetch requests
  useEffect(() => {
    if (!user?._id) return; // ✅ Wait for user to be available

    const fetchRequests = async () => {
      try {
        const res = await fetch(`/api/requests?customerId=${user._id}`);
        const data = await res.json();
        setRequests(data);
      } catch (err) {
        console.error("Error fetching requests", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user?._id]);

  // Submit new request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?._id) {
      console.error("No user logged in!");
      return;
    }

    const body = {
      ...form,
      customerId: user._id, // include customerId
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create request");

      const newReq = await res.json();
      setRequests([newReq, ...requests]); // prepend new request
      setForm({ serviceType: "", description: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Error creating request", err);
    }
  };


  return (
    <div className="p-6 space-y-6 text-black">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">My Service Requests</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Request"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-gray-50 p-4 rounded-lg border"
        >
          {/* Service Type */}
          <select
            value={form.serviceType}
            onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">Select Service Type</option>
            <option value="engine">Engine Repair</option>
            <option value="transmission">Transmission</option>
            <option value="brakes">Brake Service</option>
            <option value="suspension">Suspension & Steering</option>
            <option value="electrical">Electrical System</option>
            <option value="diagnostics">Diagnostics & Inspection</option>
            <option value="oil_change">Oil Change & Maintenance</option>
            <option value="tyres">Tyres & Wheel Alignment</option>
            <option value="ac">Air Conditioning & Heating</option>
            <option value="bodywork">Bodywork & Painting</option>
          </select>

          {/* Description */}
          <textarea
            placeholder="Describe your issue"
            className="w-full p-2 border rounded"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />

          <Button type="submit">Submit Request</Button>
        </form>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p>No requests yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <Card key={req._id as string}>
              <CardHeader>
                <CardTitle>{req.serviceType}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{req.description}</p>
                <p className="text-sm mt-2">Status: {req.status}</p>
                {req.quote && (
                  <div className="mt-2 p-2 border rounded bg-yellow-50 text-sm">
                    <p>
                      Quote: {req.quote.amount} {req.quote.currency}
                    </p>
                    <p>{req.quote.details}</p>
                    <p>
                      Approved: {req.quote.approved ? "Yes" : "No"}{" "}
                      {req.quote.approvedAt &&
                        `on ${new Date(req.quote.approvedAt).toLocaleString()}`}
                    </p>
                  </div>
                )}
                {req.payment && (
                  <div className="mt-2 p-2 border rounded bg-green-50 text-sm">
                    <p>
                      Paid {req.payment.amount} via {req.payment.method}
                    </p>
                    <p>
                      Transaction ID: {req.payment.transactionId} <br />
                      {new Date(req.payment.paidAt).toLocaleString()}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Created: {new Date(req.createdAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
