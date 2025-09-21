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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/component/ui/select";
import { Skeleton } from "@/component/ui/skeleton";

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
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
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
                <h3 className="font-semibold text-gray-700 text-lg">Car Details</h3>
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
                          carDetails: { ...form.carDetails, make: e.target.value },
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
                          carDetails: { ...form.carDetails, model: e.target.value },
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
                            year: parseInt(e.target.value) || new Date().getFullYear(),
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
                          carDetails: { ...form.carDetails, regNo: e.target.value },
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
              <CardHeader >
                <div className="flex text-amber-700 justify-between items-start">
                  <CardTitle >
                    {req.yard?.name || "Unnamed Yard"}
                  </CardTitle>
                  <Badge
                    variant={getStatusVariant(req.status)}
                    className="capitalize"
                  >
                    {req.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                    {formatDate(req.createdAt|| "date")}
                </p>
              </CardHeader>

              <CardContent >
                <div className=" " >
                  <h4 className="font-bold text-emerald-800 mb-1">Yard Address</h4>
                  <p className="text-stone-600 ">{req.yard?.address || "N/A"}</p>
                </div>

                <div>
                  <h4 className="font-bold text-emerald-800 mb-1">Car Details</h4>
                  <p className="text-stone-600 ">
                    {req.carDetails?.make} {req.carDetails?.model} ({req.carDetails?.year})
                  </p>
                  <p className="text-stone-600 ">Reg: {req.carDetails?.regNo || "N/A"}</p>
                </div>

                {req.preferredWindow && (
                  <div>
                    <h4 className="font-bold text-emerald-800 mb-1">Preferred Service Window</h4>
                    <p className="text-stone-600 ">
                      {formatDate(req.preferredWindow.start)} - {formatDate(req.preferredWindow.end)}
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => toggleRequestDetails(req._id as string)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  {expandedRequestId === req._id ? (
                    <>
                      <CollapseIcon size={16} />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ExpandIcon size={16} />
                      View Details
                    </>
                  )}
                </Button>

                {/* {expandedRequestId === req._id && (
                  <div className="pt-4 border-t space-y-4">
                    {req.quote && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-amber-50 p-4 border-b">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-amber-800">
                              Quote Summary
                            </h3>
                            <span className="font-bold text-amber-900 text-lg">
                              {formatCurrency(req.quote.amount, req.quote.currency)}
                            </span>
                          </div>

                          {!req.quote.approved && (
                            <div className="mt-3">
                              <Button
                                onClick={() => handleApproveQuote(req._id as string)}
                                disabled={approvingQuote === req._id}
                                className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                              >
                                {approvingQuote === req._id ? (
                                  "Processing..."
                                ) : (
                                  <>
                                    <CheckCircleIcon size={16} />
                                    Approve Quote
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-white">
                          <h4 className="font-medium mb-3 text-gray-700">
                            Quote Breakdown:
                          </h4>
                          <div className="space-y-3">
                            {req.quote.details && parseQuoteDetails(req.quote.details).map(
                              (item, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm p-2 even:bg-gray-50 rounded"
                                >
                                  <div className="flex-1">
                                    <span className="font-medium text-gray-800">
                                      {item.item}
                                    </span>
                                    <span className="text-gray-500 ml-2">
                                      (Qty: {item.qty})
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-gray-600">
                                      {formatCurrency(
                                        item.unitPrice,
                                        req.quote?.currency || "KES"
                                      )}{" "}
                                      × {item.qty}
                                    </div>
                                    <div className="font-medium text-gray-900">
                                      {formatCurrency(
                                        item.subtotal,
                                        req.quote?.currency || "KES"
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}

                            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-gray-900">
                              <div>Total</div>
                              <div>
                                {formatCurrency(
                                  req.quote.amount,
                                  req.quote.currency
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {req.quote.approved && (
                          <div className="p-3 bg-green-50 border-t">
                            <p className="text-green-700 font-medium flex items-center gap-1">
                              <CheckCircleIcon size={18} />
                              Quote approved on {formatDate(req.quote.approvedAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {req.payment && (
                      <div className="p-4 border rounded-lg bg-green-50">
                        <h3 className="font-semibold text-green-800 mb-2">
                          Payment Information
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-gray-600">Amount:</div>
                          <div className="font-medium">
                            {formatCurrency(
                              req.payment.amount,
                              req.payment.currency || "KES"
                            )}
                          </div>

                          <div className="text-gray-600">Method:</div>
                          <div className="capitalize font-medium">
                            {req.payment.method}
                          </div>

                          <div className="text-gray-600">Transaction ID:</div>
                          <div className="font-medium">
                            {req.payment.transactionId}
                          </div>

                          <div className="text-gray-600">Paid at:</div>
                          <div className="font-medium">
                            {formatDate(req.payment.paidAt)}
                          </div>
                        </div>
                      </div>
                    )}

                    {req.completedAt && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-700 font-medium">
                          Service completed on {formatDate(req.completedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                )} */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}