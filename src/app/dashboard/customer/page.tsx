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
import MapPicker from "@/component/mappicker";
import {
  BuildingIcon,
  CalendarIcon,
  ClockIcon,
  InfoIcon,
  MapPinIcon,
  Navigation,
  NavigationIcon,
  PlusCircleIcon,
} from "lucide-react";

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
        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle>
              <PlusCircleIcon className="w-6 h-6" />
              New Service Request
            </CardTitle>
            <p className="text-blue-100 font-light">
              Fill in the details below to create a new service request
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Progress Steps Indicator */}
              <div className="flex items-center justify-center mb-2">
                <div className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <span className="text-xs mt-1 text-blue-600 font-medium">
                      Yard Info
                    </span>
                  </div>
                  <div className="w-16 h-0.5 bg-blue-200 mx-2"></div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-200 text-blue-600 flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <span className="text-xs mt-1 text-gray-500">
                      Car Details
                    </span>
                  </div>
                  <div className="w-16 h-0.5 bg-gray-200 mx-2"></div>
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <span className="text-xs mt-1 text-gray-500">Schedule</span>
                  </div>
                </div>
              </div>

              {/* Yard Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Yard Information
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="yardName"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      <BuildingIcon className="w-4 h-4" />
                      Yard Name
                    </Label>
                    <Input
                      id="yardName"
                      type="text"
                      placeholder="e.g., Main Storage Yard"
                      value={form.yard.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({
                          ...form,
                          yard: { ...form.yard, name: e.target.value },
                        })
                      }
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="yardAddress"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      <MapPinIcon className="w-4 h-4" />
                      Yard Address
                    </Label>
                    <Input
                      id="yardAddress"
                      type="text"
                      placeholder="e.g., 123 Business Park, Nairobi"
                      value={form.yard.address}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForm({
                          ...form,
                          yard: { ...form.yard, address: e.target.value },
                        })
                      }
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
<div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Location
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your GPS location helps us assign nearby jobs and improve
                service efficiency.
              </p>

              
            </div>
                {/* Map Picker Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <NavigationIcon className="w-4 h-4" />
                    Yard Location
                  </Label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <MapPicker
                      value={form.yard.location.coordinates}
                      onChange={(coords) =>
                        setForm({
                          ...form,
                          yard: {
                            ...form.yard,
                            location: {
                              ...form.yard.location,
                              coordinates: coords,
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <InfoIcon className="w-4 h-4" />
                    Click on the map to pinpoint your yard location
                  </p>
                </div>
              </div>

              {/* Car Details Section */}
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Vehicle Details
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="carMake"
                      className="text-sm font-medium text-gray-700"
                    >
                      Make
                    </Label>
                    <Input
                      id="carMake"
                      type="text"
                      placeholder="e.g., Toyota"
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
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="carModel"
                      className="text-sm font-medium text-gray-700"
                    >
                      Model
                    </Label>
                    <Input
                      id="carModel"
                      type="text"
                      placeholder="e.g., Land Cruiser"
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
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="carYear"
                      className="text-sm font-medium text-gray-700"
                    >
                      Year
                    </Label>
                    <Input
                      id="carYear"
                      type="number"
                      placeholder="e.g., 2022"
                      min="1990"
                      max={new Date().getFullYear()}
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
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="carRegNo"
                      className="text-sm font-medium text-gray-700"
                    >
                      Registration Number
                    </Label>
                    <Input
                      id="carRegNo"
                      type="text"
                      placeholder="e.g., KCA 123A"
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
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 uppercase"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="carType"
                    className="text-sm font-medium text-gray-700"
                  >
                    Vehicle Type
                  </Label>
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
                    <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="heavy">Heavy Vehicle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service Window Section */}
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Service Schedule
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="startTime"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Preferred Start
                    </Label>
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
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="endTime"
                      className="text-sm font-medium text-gray-700 flex items-center gap-1"
                    >
                      <ClockIcon className="w-4 h-4" />
                      Preferred End
                    </Label>
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
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg"
                >
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Submit Request
                </Button>
              </div>
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
