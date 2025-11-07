
import EventsList from "@/app/components/Event/EventsList";
import { ToastContainer } from "react-toastify";
export default function EventsPage() {
  return (
    <main className="p-6">
      <ToastContainer/>
      <EventsList />
    </main>
  );
}
