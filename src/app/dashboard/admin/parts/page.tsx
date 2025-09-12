"use client";
import { useState, useEffect } from "react";

interface Part {
  _id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  unit: string;
}

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Omit<Part, "_id">>({
    name: "",
    description: "",
    price: 0,
    stock: 0,
    unit: "pcs",
  });

  // Fetch parts
  useEffect(() => {
    fetchParts();
  }, []);

  async function fetchParts() {
    setLoading(true);
    const res = await fetch("/api/admin/parts");
    const data = await res.json();
    setParts(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", description: "", price: 0, stock: 0, unit: "pcs" });
      fetchParts();
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/parts/${id}`, { method: "DELETE" });
    fetchParts();
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">Manage Parts</h1>

      {/* Add Part Form */}
      <form onSubmit={handleSubmit} className="space-y-2 bg-gray-50 p-4 text-gray-700 rounded-lg mb-6">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <div className="flex space-x-2">
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className="border p-2 rounded w-1/3"
            required
          />
          <input
            type="number"
            placeholder="Stock"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            className="border p-2 rounded w-1/3"
          />
          <input
            type="text"
            placeholder="Unit (pcs, liters)"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="border p-2 rounded w-1/3"
            required
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Add Part
        </button>
      </form>

      {/* Parts Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border">
          <thead className="bg-gray-200 text-gray-600 ">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Price</th>
              <th className="p-2 border">Stock</th>
              <th className="p-2 border">Unit</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr key={p._id}>
                <td className="p-2 border text-gray-500">{p.name}</td>
                <td className="p-2 border text-gray-500">{p.price}</td>
                <td className="p-2 border text-gray-500">{p.stock}</td>
                <td className="p-2 border text-gray-500">{p.unit}</td>
                <td className="p-2 border text-gray-500">
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {parts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-2 text-center text-gray-500">
                  No parts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
