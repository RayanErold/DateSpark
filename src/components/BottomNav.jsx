import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

const BottomNav = ({ onProfileClick }) => {
    const location = useLocation();
    const [userInitial, setUserInitial] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const name = user.user_metadata?.first_name || 'Kade. D';
                setUserInitial(name.charAt(0).toUpperCase());
                setAvatarUrl(user.user_metadata?.avatar_url);
            }
        };
        fetchUser();
    }, []);
    
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-100 pb-5 pt-3 shadow-[0_-5px_30px_-15px_rgba(0,0,0,0.1)] rounded-t-3xl">
            <div className="flex justify-evenly items-center px-4 max-w-md mx-auto relative">
                <Link to="/dashboard" className="flex flex-col items-center gap-1.5 min-w-[64px] transition-transform active:scale-95">
                    <Home className={`w-6 h-6 ${location.pathname === '/dashboard' ? 'text-coral fill-coral/20' : 'text-gray-400'}`} />
                    <span className={`text-[11px] font-bold ${location.pathname === '/dashboard' ? 'text-navy' : 'text-gray-400'}`}>Home</span>
                </Link>
                
                <div className="relative -top-5">
                    <Link to="/generate" className="w-14 h-14 bg-navy rounded-full flex items-center justify-center shadow-lg shadow-navy/30 text-white transform hover:scale-105 active:scale-95 transition-all border-4 border-white">
                        <Plus className="w-7 h-7" />
                    </Link>
                </div>

                <button onClick={(e) => { e.preventDefault(); if(onProfileClick) onProfileClick(); }} className="flex flex-col items-center gap-1.5 min-w-[64px] transition-transform active:scale-95">
                    {avatarUrl ? (
                        <img 
                            src={avatarUrl} 
                            alt="Profile" 
                            className="w-7 h-7 rounded-lg object-cover border border-coral/20" 
                            onError={() => setAvatarUrl(null)}
                        />
                    ) : userInitial ? (
                        <div className="w-7 h-7 rounded-full bg-coral/10 text-coral flex items-center justify-center font-black text-xs border border-coral/20">
                            {userInitial}
                        </div>
                    ) : (
                        <User className="w-6 h-6 text-gray-400" />
                    )}
                    <span className="text-[11px] font-bold text-gray-400">Profile</span>
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
