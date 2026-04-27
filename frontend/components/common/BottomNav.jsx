import React, { useState } from 'react';
import { Home, Compass, Ticket, User } from 'lucide-react';

const BottomNav = ({ currentTab, onTabChange, avatarUrl, userInitial, appTheme = 'light' }) => {
    const [imgError, setImgError] = useState(false);

    const isDark = appTheme === 'dark';
    
    const tabs = [
        { id: 'discovery', label: 'Discover',  icon: Compass, badge: null },
        { id: 'home',      label: 'Home',      icon: Home,    badge: null },
        { id: 'events',    label: 'Events',    icon: Ticket,  badge: 'NEW' },
    ];

    return (
        <div
            className={`md:hidden fixed bottom-0 left-0 right-0 z-[60] backdrop-blur-md border-t pt-3 shadow-[0_-5px_30px_-15px_rgba(0,0,0,0.15)] rounded-t-[2rem] transition-colors duration-300 ${
                isDark
                    ? 'bg-[#0d1220]/95 border-white/10'
                    : 'bg-white/95 border-gray-100'
            }`}
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        >
            <div className="flex justify-evenly items-center px-2 max-w-md mx-auto relative">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="flex flex-col items-center gap-1 min-w-[60px] min-h-[52px] transition-all transform active:scale-90 relative"
                        >
                            <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                                isActive ? 'bg-coral/10 scale-110' : ''
                            }`}>
                                <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-coral' : isDark ? 'text-white/40' : 'text-gray-400'}`} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-coral' : isDark ? 'text-white/40' : 'text-gray-400'}`}>
                                {tab.label}
                            </span>
                            {tab.badge && (
                                <div className="absolute top-0 right-1 bg-coral text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest leading-none">
                                    {tab.badge}
                                </div>
                            )}
                            {isActive && (
                                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-coral" />
                            )}
                        </button>
                    );
                })}

                {/* Profile tab */}
                <button
                    onClick={() => onTabChange('account')}
                    className="flex flex-col items-center gap-1 min-w-[60px] min-h-[52px] transition-all transform active:scale-90 relative"
                >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                        currentTab === 'account' ? 'bg-coral/10 scale-110' : ''
                    }`}>
                        <div className={`w-7 h-7 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                            currentTab === 'account' ? 'border-coral shadow-md shadow-coral/20' : isDark ? 'border-white/20' : 'border-gray-200'
                        }`}>
                            {avatarUrl && !imgError ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : userInitial ? (
                                <div className={`w-full h-full flex items-center justify-center font-black text-[11px] ${
                                    currentTab === 'account' ? 'bg-coral text-white' : isDark ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {userInitial}
                                </div>
                            ) : (
                                <User className={`w-full h-full p-0.5 ${currentTab === 'account' ? 'text-coral' : isDark ? 'text-white/40' : 'text-gray-400'}`} />
                            )}
                        </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${currentTab === 'account' ? 'text-coral' : isDark ? 'text-white/40' : 'text-gray-400'}`}>
                        Profile
                    </span>
                    {currentTab === 'account' && (
                        <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-coral" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
