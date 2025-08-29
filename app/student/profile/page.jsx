import {fetchUserDetail} from "@/lib/api/index"
export default function ProfilePage() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">My Profile</h2>
      <p>Student details will be shown here.</p>
      {console.log( fetchUserDetail())}
      
    </div>
  );
}
