import React from 'react';

const UsageBadge = ({ usage, limit, label, isPremium }) => {
    if (isPremium) return null;
    
    // Calculate percentage for progress bar (optional)
    const percentage = Math.min((usage / limit) * 100, 100);
    const isNearLimit = usage >= limit - 1;
    const isAtLimit = usage >= limit;

    return (
        <div className={`flex flex-col gap-1 px-3 py-2 rounded-xl border transition-all ${
            isAtLimit ? 'bg-red-50 border-red-100' : 
            isNearLimit ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'
        }`}>
            <div className="flex items-center justify-between gap-4">
                <span className={`text-[9px] font-black uppercase tracking-widest ${
                    isAtLimit ? 'text-red-500' : 
                    isNearLimit ? 'text-amber-600' : 'text-gray-400'
                }`}>
                    {label}
                </span>
                <span className={`text-[10px] font-black ${
                    isAtLimit ? 'text-red-600' : 'text-navy'
                }`}>
                    {usage}/{limit}
                </span>
            </div>
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-500 ${
                        isAtLimit ? 'bg-red-500' : 
                        isNearLimit ? 'bg-amber-500' : 'bg-coral'
                    }`} 
                    style={{ width: `${percentage}%` }} 
                />
            </div>
        </div>
    );
};

export default UsageBadge;
