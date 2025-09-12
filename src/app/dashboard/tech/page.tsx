"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext"; // provides currentUser
import { Button } from "@/component/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/component/ui/card";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
interface Technician {
  _id: string;
  userId: string;
  skills: string[];
  currentJobs: number;
  availability: {
    start: string;
    end: string;
    days: string[];
  };
}

interface AssignedJob {
  _id: string;
  serviceType: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function TechDashboard() {
  const { user } = useUser();
  const [tech, setTech] = useState<Technician | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSkillsForm, setShowSkillsForm] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const [jobs, setJobs] = useState<AssignedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<AssignedJob | null>(null);
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [laborHours, setLaborHours] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [parts, setParts] = useState<
    { _id: string; name: string; unit: string }[]
  >([]);
  const [selectedParts, setSelectedParts] = useState<
    { partId: string; quantity: number }[]
  >([]);

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const res = await fetch("/api/admin/parts");
        const data = await res.json();
        setParts(data);
      } catch (err) {
        console.error("Error fetching parts", err);
      }
    };
    fetchParts();
  }, []);

  // Fetch technician profile and assigned jobs
  useEffect(() => {
    const fetchTechData = async () => {
      if (!user?._id) return;
      setLoading(true);

      try {
        // Fetch technician profile by userId
        const res = await fetch(`/api/technicians?userId=${user._id}`);
        const techData: Technician = await res.json();
        setTech(techData);

        if (techData?._id) {
          // ✅ Now use technician._id for assigned jobs
          const jobsRes = await fetch(
            `/api/requests?technicianId=${techData._id}`
          );
          const jobsData: AssignedJob[] = await jobsRes.json();
          setJobs(jobsData);
        }
      } catch (err) {
        console.error("Error fetching technician data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechData();
  }, [user]);
  const handleUpdateJob = async () => {
    if (!selectedJob) return;

    try {
      // 1️⃣ Upload photos to Firebase
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

      // 2️⃣ Build update payload
      const formData = {
        inspectionNotes,
        laborHours,
        status: "quoted",
        partsUsed: selectedParts.filter((sp) => sp.partId && sp.quantity > 0),
        photos: uploadedUrls, // ✅ Firebase URLs
      };

      // 3️⃣ Send PATCH request
      const res = await fetch(`/api/requests/${selectedJob._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update job");

      const updated = await res.json();

      // 4️⃣ Update UI state
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

  // Add new skill
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

  // Remove a skill
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
            <div className="absolute right-0 mt-2 w-64 bg-gray-50 border rounded-lg p-4 shadow-lg z-50">
              <h2 className="font-semibold mb-2">Manage Skills</h2>
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="New skill"
                  className="flex-1 border px-2 py-1 rounded"
                />
                <Button onClick={handleAddSkill}>Add</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {selectedJob && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <h2 className="font-bold mb-4">
              Work on {selectedJob.serviceType}
            </h2>

            <textarea
              placeholder="Inspection notes"
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              className="w-full border rounded p-2 mb-2"
            />

            <input
              type="number"
              placeholder="Labor hours"
              value={laborHours}
              onChange={(e) => setLaborHours(parseFloat(e.target.value))}
              className="w-full border rounded p-2 mb-2"
            />
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Parts Used</h3>

              {selectedParts.map((sp, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <select
                    value={sp.partId}
                    onChange={(e) => {
                      const updated = [...selectedParts];
                      updated[index].partId = e.target.value;
                      setSelectedParts(updated);
                    }}
                    className="flex-1 border rounded p-2"
                  >
                    <option value="">Select part</option>
                    {parts.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={sp.quantity}
                    min={1}
                    onChange={(e) => {
                      const updated = [...selectedParts];
                      updated[index].quantity = Number(e.target.value);
                      setSelectedParts(updated);
                    }}
                    className="w-20 border rounded p-2"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedParts(
                        selectedParts.filter((_, i) => i !== index)
                      )
                    }
                    className="text-red-500"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <Button
                type="button"
                onClick={() =>
                  setSelectedParts([
                    ...selectedParts,
                    { partId: "", quantity: 1 },
                  ])
                }
              >
                + Add Part
              </Button>
            </div>

            <input
              type="file"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files || []))}
              className="mb-2"
            />

            <div className="flex gap-2">
              <Button onClick={handleUpdateJob}>Save</Button>
              <Button onClick={() => setSelectedJob(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-lg font-bold">Assigned Jobs</h2>
      {jobs.length === 0 ? (
        <p>No jobs assigned yet.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <Card key={job._id}>
              <CardHeader>
                <CardTitle>{job.serviceType}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{job.description}</p>
                <p className="text-sm mt-2">Status: {job.status}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Created: {new Date(job.createdAt).toLocaleString()}
                </p>
                <Button
                  onClick={() => {
                    setSelectedJob(job);
                  }}
                >
                  Work on Job
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
