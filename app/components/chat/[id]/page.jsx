"use client";
import { useParams } from "next/navigation";

export default function ChatPage() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Chat - {id}</h1>
      <div className="mt-4 border rounded-lg p-4 h-[400px] overflow-y-auto bg-gray-50">
        <p className="text-gray-500">No messages yet...</p>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border rounded-lg p-2"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Send
        </button>
      </div>
    </div>
  );
}
