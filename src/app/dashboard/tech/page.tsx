"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/component/ui/card";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { ITechnician } from "@/models/Technician";
import { ICustomerRequest } from "@/models/CustomerRequest";
import VehicleChecklistForm from "@/component/forms/VehicleChecklistForm";
type Technician = ITechnician & { _id: string };
type CustomerRequest = ICustomerRequest & { _id: string };

export default function TechDashboard() {
  const { user } = useUser();
  const [tech, setTech] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);

  const [showSkillsForm, setShowSkillsForm] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const [jobs, setJobs] = useState<CustomerRequest[]>([]);
  const [selectedJob, setSelectedJob] = useState<CustomerRequest | null>(null);

  const [inspectionNotes, setInspectionNotes] = useState("");
  const [laborHours, setLaborHours] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [parts, setParts] = useState<
    { _id: string; name: string; unit: string }[]
  >([]);
  const [selectedParts, setSelectedParts] = useState<
    { partId: string; quantity: number }[]
  >([]);

  // 🔹 Fetch parts catalog

  // 🔹 Fetch technician + assigned jobs
  useEffect(() => {
    const fetchTechData = async () => {
      if (!user?._id) return;
      setLoading(true);

      try {
        const res = await fetch(`/api/technicians?userId=${user._id}`);
        const techData: Technician = await res.json();
        setTech(techData);
        console.log("Fetched tech data:", techData);
        if (techData?._id) {
          const jobsRes = await fetch(
            `/api/requests?technicianId=${techData._id}`
          );
          const jobsData: CustomerRequest[] = await jobsRes.json();
          setJobs(jobsData);
          console.log("Fetched assigned jobs:", jobsData);
        }
      } catch (err) {
        console.error("Error fetching technician data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechData();
  }, [user]);

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
        status: "report_submitted", // match CustomerRequest model
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
      setInspectionNotes("");
      setLaborHours(0);
      setSelectedParts([]);
      setPhotos([]);
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

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6 space-y-6 text-black">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Welcome, {user?.name}</h1>
        <div className="relative">
          <Button onClick={() => setShowSkillsForm(!showSkillsForm)}>
            Profile
          </Button>
          {showSkillsForm && tech && (
            <div className="absolute right-0 mt-2 w-80 bg-gray-50 border rounded-lg p-4 shadow-lg z-50">
              <h2 className="font-semibold mb-2">Manage Skills & Location</h2>

              {/* Skills */}
              {Array.isArray(tech?.skills) && tech.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 mb-2">
                  {tech.skills.map((skill) => (
                    <div
                      key={skill}
                      className="bg-gray-200 px-2 py-1 rounded flex items-center gap-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-2">
                  No skills added yet
                </p>
              )}

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="New skill"
                  className="flex-1 border px-2 py-1 rounded"
                />
                <Button onClick={handleAddSkill}>Add</Button>
              </div>

              {/* Location */}
              <h3 className="font-semibold mb-2">Location</h3>
              <p className="text-sm text-gray-500 mb-2">
                Your GPS location will be saved securely. It won’t be shown
                here.
              </p>

              <div className="flex justify-between">
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
                          setShowSkillsForm(false);
                        } catch (err) {
                          console.error("Error saving location", err);
                        }
                      });
                    } else {
                      alert("Geolocation is not supported on this device.");
                    }
                  }}
                >
                  Save Current Location
                </Button>

                <Button
                  onClick={() => setShowSkillsForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">
                Work on {selectedJob.carDetails.make}{" "}
                {selectedJob.carDetails.model}
              </h2>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              <VehicleChecklistForm />
            </div>

            <div className="flex gap-2 pt-4 border-t mt-4">
              <Button
                onClick={() => setSelectedJob(null)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assigned jobs */}
      <h2 className="text-lg font-bold">Assigned Jobs</h2>
      {jobs.length === 0 ? (
        <p>No jobs assigned yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <Card key={job._id}>
              <CardHeader>
                <CardTitle>
                  {job.carDetails.make} {job.carDetails.model} (
                  {job.carDetails.type})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>Yard:</strong> {job.yard.name}, {job.yard.address}
                </p>
                <p className="text-sm mt-2">Status: {job.status}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Created: {new Date(job.createdAt).toLocaleString()}
                </p>
                <Button className="mr-4" onClick={() => setSelectedJob(job)}>
                  Work on Job
                </Button>
                <Button
  onClick={async () => {
    try {
      const res = await fetch(`/api/requests/${job._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "scheduled" }),
      });
      if (!res.ok) throw new Error("Failed to accept job");
      const updated = await res.json();
      setJobs(jobs.map((j) => (j._id === updated._id ? updated : j)));
    } catch (err) {
      console.error("Error accepting job:", err);
    }
  }}
>
  Accept Job
</Button>

              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
