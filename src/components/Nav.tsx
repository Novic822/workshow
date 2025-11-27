import {LogOut, MapPin, Menu, X} from "lucide-react";
import { Link, useLocation } from 'react-router-dom';
import {useAuth} from "../contexts/AuthContext.tsx";
import { useState } from 'react';

export default function Nav() {
    const { user, profile, signOut } = useAuth();
    const [open, setOpen] = useState(false);

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

                        {/* Desktop nav - hidden on small screens */}
                        <div className="hidden md:flex">
                            <NavLinks />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Desktop profile/signout */}
                        <div className="hidden sm:flex items-center gap-4">
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

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setOpen(!open)}
                                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
                                aria-label="Toggle menu"
                                aria-expanded={open}
                            >
                                {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile dropdown */}
            {open && (
                <div className="md:hidden border-t border-gray-100">
                    <div className="px-4 py-3 space-y-2">
                        <NavLinks mobile />
                        <div className="pt-2 border-t border-gray-100">
                            <div className="px-2 py-2">
                                <p className="text-sm font-medium text-gray-800">{profile?.display_name}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                            </div>
                            <div className="px-2 py-2">
                                <button
                                    onClick={() => { setOpen(false); signOut(); }}
                                    className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                                >
                                    <div className="flex items-center gap-2"><LogOut className="w-4 h-4"/> Sign out</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

function NavLinks({ mobile }: { mobile?: boolean }) {
    const { pathname } = useLocation();

    const linkClass = (path: string) =>
        `px-3 py-1 rounded-md text-sm font-medium ${pathname === path ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`;

    if (mobile) {
        return (
            <div className="flex flex-col">
                <Link to="/app" className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/app' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>Dashboard</Link>
                <Link to="/friends" className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/friends' ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}>Friends</Link>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Link to="/app" className={linkClass('/app')}>Dashboard</Link>
            <Link to="/friends" className={linkClass('/friends')}>Friends</Link>
        </div>
    );
}