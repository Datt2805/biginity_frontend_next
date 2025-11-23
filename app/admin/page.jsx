"use client";
import { useEffect, useState } from "react";
import { verifyTeacher } from "@/lib/api";

export default function TeacherVerificationPage() {
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    setLoading(true);
    try {
      const res = await getPendingTeachers();
      setPendingTeachers(res.teachers);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleVerify(userId) {
    try {
      await verifyTeacher(userId);
      alert("Teacher verified successfully!");
      loadTeachers(); // refresh UI
    } catch (err) {
      console.error(err);
      alert("Error verifying teacher");
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Pending Teacher Verifications</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {pendingTeachers.map((t) => (
            <tr key={t._id}>
              <td className="border p-2">{t.name}</td>
              <td className="border p-2">{t.email}</td>
              <td className="border p-2">
                {t.isVerified ? "Verified" : "Pending"}
              </td>
              <td className="border p-2">
                {!t.isVerified && (
                  <button
                    onClick={() => handleVerify(t._id)}
                    className="bg-green-600 text-white py-1 px-3 rounded"
                  >
                    Verify
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
