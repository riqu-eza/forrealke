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

interface IQuoteItem {
  item: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export default function CustomerDashboard() {
  const [requests, setRequests] = useState<ICustomerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ serviceType: "", description: "" });
  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);
  const [approvingQuote, setApprovingQuote] = useState<string | null>(null);
  const { user } = useUser();

  // Fetch requests
  useEffect(() => {
    if (!user?._id) return;

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
      setForm({ serviceType: "", description: "" });
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

    setExpandedQuoteId(null);
  } catch (err) {
    console.error("Error approving quote", err);
  } finally {
    setApprovingQuote(null);
  }
};


  // Toggle quote details view
  const toggleQuoteDetails = (quoteId: string) => {
    setExpandedQuoteId(expandedQuoteId === quoteId ? null : quoteId);
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
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'assigned': return 'outline';
      case 'in_progress': return 'default';
      case 'quoted': return 'outline';
      case 'approved': return 'default';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">My Service Requests</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          {showForm ? "Cancel" : "New Request"}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle >Create New Service Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  id="serviceType"
                  value={form.serviceType}
                  onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Describe your issue in detail..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
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
            <Card key={req._id as string} className="bg-white shadow-md overflow-hidden">
              <CardHeader >
                <div className="flex justify-between items-start">
                  <CardTitle >
                    {req.serviceType.replace('_', ' ')}
                  </CardTitle>
                  <Badge variant={getStatusVariant(req.status)} className="capitalize">
                    {req.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Created: {new Date(req.createdAt).toLocaleString()}
                </p>
              </CardHeader>
              
              <CardContent >
                <p className="text-gray-700 mb-4">{req.description}</p>
                
                {req.quote && (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <div className="bg-amber-50 p-4 border-b">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-amber-800">Quote Summary</h3>
                        <span className="font-bold text-amber-900 text-lg">
                          {formatCurrency(req.quote.amount, req.quote.currency)}
                        </span>
                      </div>
                      
                      <div className="mt-3 flex justify-between">
                        <Button 
                          variant="outline" 
                          
                          onClick={() => toggleQuoteDetails(req._id as string)}
                          className="flex items-center gap-1 text-amber-700 border-amber-300 hover:bg-amber-100"
                        >
                          {expandedQuoteId === req._id ? (
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
                        
                        {!req.quote.approved && (
                          <Button 
                           
                            onClick={() => handleApproveQuote(req._id as string)}
                            disabled={approvingQuote === req._id}
                            className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
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
                        )}
                      </div>
                    </div>
                    
                    {expandedQuoteId === req._id && (
                      <div className="p-4 bg-white">
                        <h4 className="font-medium mb-3 text-gray-700">Quote Breakdown:</h4>
                        <div className="space-y-3">
                          {parseQuoteDetails(req.quote.details).map((item, index) => (
                            <div key={index} className="flex justify-between text-sm p-2 even:bg-gray-50 rounded">
                              <div className="flex-1">
                                <span className="font-medium text-gray-800">{item.item}</span>
                                <span className="text-gray-500 ml-2">(Qty: {item.qty})</span>
                              </div>
                              <div className="text-right">
                                <div className="text-gray-600">
                                  {formatCurrency(item.unitPrice, req.quote?.currency || "KES")} × {item.qty}
                                </div>
                                <div className="font-medium text-gray-900">
                                  {formatCurrency(item.subtotal, req.quote?.currency || "KES")}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          <div className="border-t pt-2 mt-2 flex justify-between font-bold text-gray-900">
                            <div>Total</div>
                            <div>{formatCurrency(req.quote.amount, req.quote.currency)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {req.quote.approved && (
                      <div className="p-3 bg-green-50 border-t">
                        <p className="text-green-700 font-medium flex items-center gap-1">
                          <CheckCircleIcon size={18} />
                          Quote approved on {req.quote.approvedAt ? new Date(req.quote.approvedAt).toLocaleString() : "N/A"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                {req.payment && (
                  <div className="mt-4 p-4 border rounded-lg bg-green-50">
                    <h3 className="font-semibold text-green-800 mb-2">Payment Information</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-600">Amount:</div>
                      <div className="font-medium">{formatCurrency(req.payment.amount, req.payment.currency || "KES")}</div>
                      
                      <div className="text-gray-600">Method:</div>
                      <div className="capitalize font-medium">{req.payment.method}</div>
                      
                      <div className="text-gray-600">Transaction ID:</div>
                      <div className="font-medium">{req.payment.transactionId}</div>
                      
                      <div className="text-gray-600">Paid at:</div>
                      <div className="font-medium">{new Date(req.payment.paidAt).toLocaleString()}</div>
                    </div>
                  </div>
                )}
                
                {req.completedAt && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-blue-700 font-medium">
                      Service completed on {new Date(req.completedAt).toLocaleDateString()}
                    </p>
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