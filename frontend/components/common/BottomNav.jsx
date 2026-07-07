import React, { useState } from 'react';
import { Home, Ticket, User, Compass } from 'lucide-react';

const BottomNav = ({ currentTab, onTabChange, avatarUrl, userInitial, appTheme = 'light' }) => {
    const [imgError, setImgError] = useState(false);

    const isDark = appTheme === 'dark';

    const tabs = [
        { id: 'home',      label: 'Home',    icon: Home    },
        { id: 'discovery', label: 'Explore', icon: Compass },
        { id: 'events',    label: 'Events',  icon: Ticket  },
    ];

    return (
        <div
            className={`md:hidden fixed bottom-0 left-0 right-0 z-[60] backdrop-blur-xl border-t pt-3 shadow-[0_-5px_30px_-15px_rgba(45,27,46,0.12)] rounded-t-[2rem] transition-colors duration-300 ${
                isDark
                    ? 'bg-editorial-dark/95 border-white/8'
                    : 'bg-ivory/95 border-blush/40'
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
                                isActive ? 'bg-rose/10 scale-110' : ''
                            }`}>
                                <Icon className={`w-5 h-5 transition-colors duration-300 ${
                                    isActive ? 'text-rose' : isDark ? 'text-ivory/40' : 'text-taupe/60'
                                }`} />
                            </div>
                            <span className={`text-[9px] font-semibold uppercase tracking-widest transition-colors duration-300 font-outfit ${
                                isActive ? 'text-rose' : isDark ? 'text-ivory/40' : 'text-taupe/60'
                            }`}>
                                {tab.label}
                            </span>
                            {isActive && (
                                <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-rose" />
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
                        currentTab === 'account' ? 'bg-rose/10 scale-110' : ''
                    }`}>
                        <div className={`w-7 h-7 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                            currentTab === 'account' ? 'border-rose shadow-md shadow-rose/20' : isDark ? 'border-ivory/20' : 'border-blush'
                        }`}>
                            {avatarUrl && !imgError ? (
                                <img
                                    src={avatarUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : userInitial ? (
                                <div className={`w-full h-full flex items-center justify-center font-semibold text-[11px] font-outfit ${
                                    currentTab === 'account' ? 'bg-rose text-ivory' : isDark ? 'bg-ivory/10 text-ivory/60' : 'bg-blush/60 text-taupe'
                                }`}>
                                    {userInitial}
                                </div>
                            ) : (
                                <User className={`w-full h-full p-0.5 ${currentTab === 'account' ? 'text-rose' : isDark ? 'text-ivory/40' : 'text-taupe/60'}`} />
                            )}
                        </div>
                    </div>
                    <span className={`text-[9px] font-semibold uppercase tracking-widest transition-colors duration-300 font-outfit ${
                        currentTab === 'account' ? 'text-rose' : isDark ? 'text-ivory/40' : 'text-taupe/60'
                    }`}>
                        Profile
                    </span>
                    {currentTab === 'account' && (
                        <div className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-rose" />
                    )}
                </button>
            </div>
        </div>
    );
};

export default BottomNav;
