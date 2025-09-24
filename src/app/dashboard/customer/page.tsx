/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Button } from "@/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/component/ui/card";
import { Badge } from "@/component/ui/badge";
import { useUser } from "@/context/UserContext";
import { ICustomerRequest } from "@/models/CustomerRequest";
import { useEffect, useState } from "react";
import CollapseIcon from "@/component/ui/icons/CollapseIcon";
import ExpandIcon from "@/component/ui/icons/ExpandIcon";
import CheckCircleIcon from "@/component/ui/icons/CheckCircleIcon";
import { Input } from "@/component/ui/input";
import { Label } from "@/component/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/component/ui/select";
import { Skeleton } from "@/component/ui/skeleton";
import { generateReportPDF } from "@/utils/generateReportPDF";

interface IQuoteItem {
  item: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

interface IFormData {
  serviceType: string;
  description: string;
  yard: {
    name: string;
    address: string;
    location: {
      type: "Point";
      coordinates: [number, number];
    };
  };
  carDetails: {
    make: string;
    model: string;
    year: number;
    regNo: string;
    type: string;
  };
  preferredWindow: {
    start: string;
    end: string;
  };
}

export default function CustomerDashboard() {
  const [requests, setRequests] = useState<ICustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(
    null
  );
  const [approvingQuote, setApprovingQuote] = useState<string | null>(null);
  const [form, setForm] = useState<IFormData>({
    serviceType: "",
    description: "",
    yard: {
      name: "",
      address: "",
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
    },
    carDetails: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      regNo: "",
      type: "",
    },
    preferredWindow: {
      start: "",
      end: "",
    },
  });

  const { user } = useUser();

  // Fetch requests
  useEffect(() => {
    if (!user?._id) return;

    const fetchRequests = async () => {
      try {
        const res = await fetch(`/api/requests?customerId=${user._id}`);
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
      customerId: user._id,
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create request");

      const newReq = await res.json();
      setRequests([newReq, ...requests]);
      setForm({
        serviceType: "",
        description: "",
        yard: {
          name: "",
          address: "",
          location: {
            type: "Point",
            coordinates: [0, 0],
          },
        },
        carDetails: {
          make: "",
          model: "",
          year: new Date().getFullYear(),
          regNo: "",
          type: "",
        },
        preferredWindow: {
          start: "",
          end: "",
        },
      });
      setShowForm(false);
    } catch (err) {
      console.error("Error creating request", err);
    }
  };

  // Approve a quote
  const handleApproveQuote = async (requestId: string, approved = true) => {
    setApprovingQuote(requestId);

    try {
      const res = await fetch(`/api/requests/${requestId}/approve-quote`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          userId: user?._id,
        }),
      });

      if (!res.ok) throw new Error("Failed to approve quote");

      const updatedRequest = await res.json();

      // Update state
      setRequests((prev) =>
        prev.map((req) => (req._id === requestId ? updatedRequest : req))
      );

      setExpandedRequestId(null);
    } catch (err) {
      console.error("Error approving quote", err);
    } finally {
      setApprovingQuote(null);
    }
  };

  // Toggle request details view
  const toggleRequestDetails = (requestId: string) => {
    setExpandedRequestId(expandedRequestId === requestId ? null : requestId);
  };

  // Parse quote details from JSON string
  const parseQuoteDetails = (detailsString: string): IQuoteItem[] => {
    try {
      return JSON.parse(detailsString);
    } catch (error) {
      console.error("Error parsing quote details", error);
      return [];
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = "KES") => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "new":
        return "default";
      case "pending":
        return "secondary";
      case "assigned":
        return "outline";
      case "in_progress":
        return "default";
      case "quoted":
        return "outline";
      case "approved":
        return "default";
      case "completed":
        return "success";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Format date for display
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  // Skeleton loader for requests
  const RequestSkeleton = () => (
    <Card className="bg-white shadow-md overflow-hidden">
      <CardHeader>
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-40 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-5 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">
          My Service Requests
        </h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "New Request"}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Create New Service Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* --- YARD DETAILS --- */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 text-lg">
                  Yard Information
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="yardName">Yard Name</Label>
                  <Input
                    id="yardName"
                    type="text"
                    placeholder="Yard Name"
                    value={form.yard.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({
                        ...form,
                        yard: { ...form.yard, name: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yardAddress">Yard Address</Label>
                  <Input
                    id="yardAddress"
                    type="text"
                    placeholder="Yard Address"
                    value={form.yard.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({
                        ...form,
                        yard: { ...form.yard, address: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={form.yard.location.coordinates[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({
                          ...form,
                          yard: {
                            ...form.yard,
                            location: {
                              ...form.yard.location,
                              coordinates: [
                                parseFloat(e.target.value) || 0,
                                form.yard.location.coordinates[1],
                              ],
                            },
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={form.yard.location.coordinates[1]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({
                          ...form,
                          yard: {
                            ...form.yard,
                            location: {
                              ...form.yard.location,
                              coordinates: [
                                form.yard.location.coordinates[0],
                                parseFloat(e.target.value) || 0,
                              ],
                            },
                          },
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* --- CAR DETAILS --- */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 text-lg">
                  Car Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carMake">Make</Label>
                    <Input
                      id="carMake"
                      type="text"
                      placeholder="Make"
                      value={form.carDetails.make}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({
                          ...form,
                          carDetails: {
                            ...form.carDetails,
                            make: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carModel">Model</Label>
                    <Input
                      id="carModel"
                      type="text"
                      placeholder="Model"
                      value={form.carDetails.model}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({
                          ...form,
                          carDetails: {
                            ...form.carDetails,
                            model: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="carYear">Year</Label>
                    <Input
                      id="carYear"
                      type="number"
                      placeholder="Year"
                      value={form.carDetails.year}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({
                          ...form,
                          carDetails: {
                            ...form.carDetails,
                            year:
                              parseInt(e.target.value) ||
                              new Date().getFullYear(),
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="carRegNo">Registration Number</Label>
                    <Input
                      id="carRegNo"
                      type="text"
                      placeholder="Registration Number"
                      value={form.carDetails.regNo}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({
                          ...form,
                          carDetails: {
                            ...form.carDetails,
                            regNo: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="carType">Car Type</Label>
                  <Select
                    value={form.carDetails.type}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        carDetails: { ...form.carDetails, type: value },
                      })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Car Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* --- PREFERRED WINDOW --- */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 text-lg">
                  Preferred Service Window
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={form.preferredWindow.start}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({
                          ...form,
                          preferredWindow: {
                            ...form.preferredWindow,
                            start: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={form.preferredWindow.end}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({
                          ...form,
                          preferredWindow: {
                            ...form.preferredWindow,
                            end: e.target.value,
                          },
                        })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <RequestSkeleton key={i} />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-10 bg-white shadow-md">
          <CardContent>
            <p className="text-gray-500 text-lg">No service requests yet.</p>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.map((req) => (
            <Card
              key={req._id as string}
              className="bg-white shadow-md overflow-hidden"
            >
              <CardHeader>
                <div className="flex text-amber-700 justify-between items-start">
                  <CardTitle>{req.yard?.name || "Unnamed Yard"}</CardTitle>
                  <Badge
                    variant={getStatusVariant(req.status)}
                    className="capitalize"
                  >
                    {req.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(req.createdAt || "date")}
                </p>
              </CardHeader>

              <CardContent>
                <div className=" ">
                  <h4 className="font-bold text-emerald-800 mb-1">
                    Yard Address
                  </h4>
                  <p className="text-stone-600 ">
                    {req.yard?.address || "N/A"}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-emerald-800 mb-1">
                    Car Details
                  </h4>
                  <p className="text-stone-600 ">
                    {req.carDetails?.make} {req.carDetails?.model} (
                    {req.carDetails?.year})
                  </p>
                  <p className="text-stone-600 ">
                    Reg: {req.carDetails?.regNo || "N/A"}
                  </p>
                </div>

                {req.preferredWindow && (
                  <div>
                    <h4 className="font-bold text-emerald-800 mb-1">
                      Preferred Service Window
                    </h4>
                    <p className="text-stone-600 ">
                      {formatDate(req.preferredWindow.start)} -{" "}
                      {formatDate(req.preferredWindow.end)}
                    </p>
                  </div>
                )}

                {req.status === "report_submitted" && req.report && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Inspection Report
                    </h3>

                    <div className="space-y-2">
                      {Object.entries(req.report.checklist || {}).map(
                        ([item, { status, notes }], idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-start text-sm p-2 even:bg-white odd:bg-gray-100 rounded"
                          >
                            <div>
                              <span className="font-medium text-gray-700">
                                {item}
                              </span>
                              {notes && (
                                <p className="text-gray-500 text-xs">
                                  Notes: {notes}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                status === "OK"
                                  ? "bg-green-100 text-green-700"
                                  : status === "Needs Attention"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        )
                      )}
                    </div>

                    <Button
                      onClick={() => generateReportPDF(req)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Download Report (PDF)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
