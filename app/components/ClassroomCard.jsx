"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export default function ClassroomCard({ classroomName, role, onOpenChat }) {
  const [isPresent, setIsPresent] = useState(false); // for student
  const [timer, setTimer] = useState(0); // for teacher
  const [intervalId, setIntervalId] = useState(null);

  // handle countdown cleanup
  useEffect(() => {
    if (timer <= 0 && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [timer, intervalId]);

  const handleCardClick = (e) => {
    if (e.target.tagName === "BUTTON") return; // ignore buttons
    onOpenChat(classroomName);
  };

  const handleStart = () => {
    if (intervalId) return;
    setTimer(300); // 5 minutes
    const id = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    setIntervalId(id);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <Card
      onClick={handleCardClick}
      className="cursor-pointer shadow-lg rounded-2xl p-4 bg-white hover:shadow-xl transition-all"
    >
      <CardContent className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{classroomName}</h2>
          <MessageCircle className="w-6 h-6 text-blue-500" />
        </div>

        {role === "student" && (
          <>
            <div className="flex gap-2">
              <Button
                variant={isPresent ? "secondary" : "default"}
                className="flex-1"
                onClick={() => setIsPresent(true)}
              >
                Punch In
              </Button>
              <Button
                variant={!isPresent ? "secondary" : "destructive"}
                className="flex-1"
                onClick={() => setIsPresent(false)}
              >
                Punch Out
              </Button>
            </div>
            <p
              className={`text-sm ${
                isPresent ? "text-green-600" : "text-gray-500"
              }`}
            >
              Status: {isPresent ? "Present" : "Absent"}
            </p>
          </>
        )}

        {role === "teacher" && (
          <Button
            variant={timer > 0 ? "secondary" : "default"}
            className="w-full"
            onClick={handleStart}
          >
            {timer > 0 ? `Running: ${formatTime(timer)}` : "Start Class"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
