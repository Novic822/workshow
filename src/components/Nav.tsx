import {LogOut, MapPin} from "lucide-react";
import { Link, useLocation } from 'react-router-dom';
import {useAuth} from "../contexts/AuthContext.tsx";

export default function Nav() {
    const { user, profile, signOut } = useAuth();

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center">
                            <div className="bg-teal-500 p-2 rounded-lg">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="ml-3 text-2xl font-bold text-gray-800">TravelMates</h1>
                        </div>

                        {/* Simple route navigation */}
                        <NavLinks />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-800">{profile?.display_name}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                            title="Sign out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

function NavLinks() {
    const { pathname } = useLocation();

    const linkClass = (path: string) =>
        `px-3 py-1 rounded-md text-sm font-medium ${pathname === path ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`;

    return (
        <div className="flex items-center gap-2">
            <Link to="/app" className={linkClass('/app')}>Dashboard</Link>
            <Link to="/friends" className={linkClass('/friends')}>Friends</Link>
        </div>
    );
}