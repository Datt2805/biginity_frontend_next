"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ClassroomCard from "@/app/components/ClassroomCard";
import { makeSecureRequest } from "@/lib/api"; // adjust to your API setup

export default function TeacherEnrolledPage() {
  const router = useRouter();
  const [enrolledClasses, setEnrolledClasses] = useState([]);

  useEffect(() => {
    // Example: Fetch enrolled classrooms/events for teacher
    const fetchData = async () => {
      try {
        const data = await makeSecureRequest("/api/teacher/enrolled", "GET");
        setEnrolledClasses(data || []);
      } catch (err) {
        console.error("Failed to load enrolled classes", err);
      }
    };
    fetchData();
  }, []);

  const handleOpenChat = (classroomName) => {
    router.push(`/chat/${classroomName}`);
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {enrolledClasses.length > 0 ? (
        enrolledClasses.map((cls) => (
          <ClassroomCard
            key={cls._id}
            classroomName={cls.name}
            role="teacher"
            onOpenChat={handleOpenChat}
          />
        ))
      ) : (
        <p className="text-gray-500">You are not enrolled in any classrooms.</p>
      )}
    </div>
  );
}
