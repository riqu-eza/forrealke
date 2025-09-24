/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/component/ui/card";
import { Badge } from "@/component/ui/badge";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { ITechnician } from "@/models/Technician";
import { ICustomerRequest } from "@/models/CustomerRequest";
import VehicleChecklistForm from "@/component/forms/VehicleChecklistForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/component/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/component/ui/tooltip";
import {
  MapPin,
  Wrench,
  Clock,
  Car,
  CheckCircle,
  Calendar,
  User,
  // Settings,
  X,
  Plus,
  Navigation,
} from "lucide-react";

type Technician = ITechnician & { _id: string };
type CustomerRequest = ICustomerRequest & { _id: string };

export default function TechDashboard() {
  const { user } = useUser();
  const [tech, setTech] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);

  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const [jobs, setJobs] = useState<CustomerRequest[]>([]);
  const [selectedJob, setSelectedJob] = useState<CustomerRequest | null>(null);

  const [inspectionNotes, setInspectionNotes] = useState("");
  const [laborHours, setLaborHours] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [parts, setParts] = useState<
    { _id: string; name: string; unit: string }[]
  >([]);
  const [selectedParts, setSelectedParts] = useState<
    { partId: string; quantity: number }[]
  >([]);
  const [checklistResponses, setChecklistResponses] = useState({});

  // 🔹 Fetch technician + assigned jobs
  useEffect(() => {
    const fetchTechData = async () => {
      if (!user?._id) return;
      setLoading(true);

      try {
        // Fetch technician first
        const techRes = await fetch(`/api/technicians?userId=${user._id}`);
        const techData: Technician = await techRes.json();

        if (!techData?._id) {
          console.warn("No technician found for this user");
          setTech(null);
          setJobs([]);
          return;
        }

        // Now fetch jobs assigned to this technician
        const jobsRes = await fetch(
          `/api/requests?technicianId=${techData._id}`
        );
        const jobsData: CustomerRequest[] = await jobsRes.json();

        setTech(techData);
        setJobs(jobsData);

        console.log("Fetched technician data:", techData);
        console.log("Fetched jobs data:", jobsData);
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechData();
  }, [user]);

  // 🔹 Get status badge color
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { color: "bg-blue-100 text-blue-800", label: "Assigned" },
      scheduled: { color: "bg-green-100 text-green-800", label: "Scheduled" },
      in_progress: {
        color: "bg-yellow-100 text-yellow-800",
        label: "In Progress",
      },
      report_submitted: {
        color: "bg-purple-100 text-purple-800",
        label: "Report Submitted",
      },
      completed: { color: "bg-gray-100 text-gray-800", label: "Completed" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.assigned;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  // 🔹 Submit inspection + update job
  const handleUpdateJob = async () => {
    if (!selectedJob) return;

    try {
      const uploadedUrls: string[] = [];
      for (const file of photos) {
        const storageRef = ref(
          storage,
          `jobs/${selectedJob._id}/${uuidv4()}-${file.name}`
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        uploadedUrls.push(url);
      }

      const formData = {
        inspectionNotes,
        laborHours,
        partsUsed: selectedParts.filter((sp) => sp.partId && sp.quantity > 0),
        photos: uploadedUrls,
        status: "report_submitted",
      };

      const res = await fetch(`/api/requests/${selectedJob._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update job");

      const updated = await res.json();
      setJobs(jobs.map((j) => (j._id === updated._id ? updated : j)));
      setSelectedJob(null);
    } catch (err) {
      console.error("Error updating job:", err);
    }
  };

  // 🔹 Skill management
  const handleAddSkill = async () => {
    if (!tech || !newSkill.trim()) return;
    const updatedSkills = [...tech.skills, newSkill.trim()];

    try {
      const res = await fetch("/api/technicians", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?._id,
          updates: { skills: updatedSkills },
        }),
      });
      const updatedTech: Technician = await res.json();
      setTech(updatedTech);
      setNewSkill("");
    } catch (err) {
      console.error("Error updating skills", err);
    }
  };

  const handleRemoveSkill = async (skill: string) => {
    if (!tech) return;
    const updatedSkills = tech.skills.filter((s) => s !== skill);

    try {
      const res = await fetch("/api/technicians", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?._id,
          updates: { skills: updatedSkills },
        }),
      });
      const updatedTech: Technician = await res.json();
      setTech(updatedTech);
    } catch (err) {
      console.error("Error removing skill", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
          </div>

          <div className="flex gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => setShowProfileDialog(true)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manage your profile and skills</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
              <Wrench className="h-4 w-4" />
              Available Jobs
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white border-l-4 border-l-blue-500">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Assigned Jobs
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobs.length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-green-500">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Skills</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tech?.skills?.length || 0}
                  </p>
                </div>
                <Wrench className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-l-4 border-l-purple-500">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {jobs.filter((job) => job.status === "closed").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobs Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Car className="h-6 w-6" />
              Assigned Jobs
            </h2>
            <Badge variant="secondary" className="text-sm">
              {jobs.length} jobs
            </Badge>
          </div>

          {jobs.length === 0 ? (
            <Card>
              <CardContent>
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No jobs assigned
                </h3>
                <p className="text-gray-600">
                  You don`t have any assigned jobs at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {jobs.map((job) => (
                <Card
                  key={job._id}
                  className="hover:shadow-lg transition-shadow duration-200"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>
                        <Car className="h-5 w-5 text-blue-500" />
                        {job.carDetails.make} {job.carDetails.model}
                      </CardTitle>
                      {getStatusBadge(job.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {job.yard.name}, {job.yard.address}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          Created:{" "}
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => setSelectedJob(job)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <Wrench className="h-4 w-4 mr-2" />
                          Work on Job
                        </Button>

                        {job.status === "assigned_pending" && (
                          <Button
                            onClick={async () => {
                              try {
                                const res = await fetch(
                                  `/api/requests/${job._id}`,
                                  {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      status: "scheduled",
                                    }),
                                  }
                                );
                                if (!res.ok)
                                  throw new Error("Failed to accept job");
                                const updated = await res.json();
                                setJobs(
                                  jobs.map((j) =>
                                    j._id === updated._id ? updated : j
                                  )
                                );
                              } catch (err) {
                                console.error("Error accepting job:", err);
                              }
                            }}
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Accept
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Technician Profile
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Skills Section */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Skills
              </h3>

              {Array.isArray(tech?.skills) && tech.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tech.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">
                  No skills added yet
                </p>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add new skill..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  onKeyPress={(e) => e.key === "Enter" && handleAddSkill()}
                />
                <Button onClick={handleAddSkill}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Location
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your GPS location helps us assign nearby jobs and improve
                service efficiency.
              </p>

              <Button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                      try {
                        const res = await fetch("/api/technicians", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            userId: user?._id,
                            updates: {
                              location: {
                                type: "Point",
                                coordinates: [
                                  pos.coords.longitude,
                                  pos.coords.latitude,
                                ],
                              },
                            },
                          }),
                        });
                        const updated = await res.json();
                        setTech(updated);
                        setShowProfileDialog(false);
                      } catch (err) {
                        console.error("Error saving location", err);
                      }
                    });
                  } else {
                    alert("Geolocation is not supported on this device.");
                  }
                }}
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Update Current Location
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Job Modal */}
      <Dialog
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Inspection - {selectedJob?.carDetails.make}{" "}
              {selectedJob?.carDetails.model}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            <VehicleChecklistForm requestId={selectedJob?._id || ""}
            />
          </div>

          {/* <div className="flex gap-2 pt-4 border-t mt-4">
            <Button
              onClick={() => setSelectedJob(null)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateJob}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Submit Report
            </Button>
          </div> */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
