import React from 'react';
import { Users, Check } from 'lucide-react';

const STATUS_CONFIG = {
    pending:  { label: 'Partner invited', color: 'bg-champagne/60 text-taupe border-champagne', icon: Users },
    accepted: { label: 'Partner joined',  color: 'bg-rose/10 text-rose border-rose/20',         icon: Check },
};

const CollabStatusBadge = ({ status, agreedCount, totalStops }) => {
    if (!status) return null;

    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    const showVotes = status === 'accepted' && agreedCount !== undefined && totalStops;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-widest font-outfit ${config.color}`}>
            <Icon className="w-3 h-3" />
            {showVotes ? `${agreedCount}/${totalStops} stops agreed` : config.label}
        </span>
    );
};

export default CollabStatusBadge;
