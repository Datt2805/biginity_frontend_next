export default function StudentDashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Welcome to Your Dashboard</h2>
      <p className="mb-6 text-gray-700">
        From here you can manage your profile, view your classroom, check available
        events, and see the events you’re enrolled in.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">👤 Profile</h3>
          <p className="text-sm text-gray-600 mb-3">View and update your details.</p>
          <a href="/student/profile" className="text-green-600 font-medium hover:underline">
            Go to Profile →
          </a>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">🏫 Classroom</h3>
          <p className="text-sm text-gray-600 mb-3">Access your learning materials.</p>
          <a href="/student/classroom" className="text-green-600 font-medium hover:underline">
            Enter Classroom →
          </a>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">📅 Events</h3>
          <p className="text-sm text-gray-600 mb-3">Browse and enroll in new events.</p>
          <a href="/student/events" className="text-green-600 font-medium hover:underline">
            Explore Events →
          </a>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition">
          <h3 className="text-lg font-semibold mb-2">✅ Enrolled</h3>
          <p className="text-sm text-gray-600 mb-3">View your enrolled events.</p>
          <a href="/student/enrolled" className="text-green-600 font-medium hover:underline">
            See Enrolled →
          </a>
        </div>
      </div>
    </div>
  );
}
