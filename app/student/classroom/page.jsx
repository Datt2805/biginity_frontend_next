"use client";
import { useRouter } from "next/navigation";
import ClassroomCard from "@/app/components/ClassroomCard";

export default function StudentClassroomPage() {
  const router = useRouter();

  const handleOpenChat = (classroomName) => {
    router.push(`/chat/${classroomName}`);
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ClassroomCard
        classroomName="Math Class"
        role="student"
        onOpenChat={handleOpenChat}
      />
      <ClassroomCard
        classroomName="Science Class"
        role="student"
        onOpenChat={handleOpenChat}
      />
    </div>
  );
}
