import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-cyan-50 flex items-center">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="flex items-center mb-6">
            <div className="bg-teal-500 p-3 rounded-full">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 ml-4">TravelMates</h1>
          </div>

          <h2 className="text-2xl lg:text-3xl font-semibold text-gray-700 mb-4">Map your travel connections</h2>
          <p className="text-gray-600 mb-6">Discover where your friends have been, share places, and build a map of memories together. TravelMates helps you visualize connections across the world and plan your next adventure.</p>

          <div className="flex gap-3">
            <Link to="/auth" className="inline-block bg-teal-500 hover:bg-teal-600 text-white px-5 py-3 rounded-lg font-medium">Login</Link>
            <Link to="/auth?mode=signup" className="inline-block border border-teal-500 text-teal-600 px-5 py-3 rounded-lg font-medium hover:bg-teal-50">Sign up</Link>
          </div>
        </div>

        <div className="order-first lg:order-last">
          <div className="rounded-xl overflow-hidden shadow-lg bg-white">
            <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?&auto=format&fit=crop&w=1200&q=60" alt="travel" className="w-full h-64 object-cover" />
            <div className="p-6">
              <h3 className="font-semibold text-lg">Share places & stories</h3>
              <p className="text-sm text-gray-600 mt-2">Add photos, notes and locations to the map and see your friends' travel footprints.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
