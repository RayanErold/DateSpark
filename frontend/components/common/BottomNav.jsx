import React, { useState } from 'react';
import { Home, Plus, User, Heart, Compass } from 'lucide-react';

const BottomNav = ({ currentTab, onTabChange, avatarUrl, userInitial }) => {
    const [imgError, setImgError] = useState(false);
    
    const tabs = [
        { id: 'home', label: 'Home', icon: Home },
        { id: 'favorites', label: 'Favorites', icon: Heart },
        { id: 'discovery', label: 'Discover', icon: Compass },
    ];

    return (
        <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-md border-t border-gray-100 pt-3 shadow-[0_-5px_30px_-15px_rgba(0,0,0,0.12)] rounded-t-[2.5rem]"
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
                                <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-coral' : 'text-gray-400'}`} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-coral' : 'text-gray-400'}`}>
                                {tab.label}
                            </span>
                            {isActive && (
                                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-coral" />
                            )}
                        </button>
                    );
                })}

                <button 
                    onClick={() => onTabChange('account')} 
                    className="flex flex-col items-center gap-1 min-w-[60px] min-h-[52px] transition-all transform active:scale-90 relative"
                >
                    <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                        currentTab === 'account' ? 'bg-coral/10 scale-110' : ''
                    }`}>
                        <div className={`w-7 h-7 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                            currentTab === 'account' ? 'border-coral shadow-md shadow-coral/20' : 'border-gray-200'
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
                                    currentTab === 'account' ? 'bg-coral text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {userInitial}
                                </div>
                            ) : (
                                <User className={`w-full h-full p-0.5 ${currentTab === 'account' ? 'text-coral' : 'text-gray-400'}`} />
                            )}
                        </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${currentTab === 'account' ? 'text-coral' : 'text-gray-400'}`}>
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
