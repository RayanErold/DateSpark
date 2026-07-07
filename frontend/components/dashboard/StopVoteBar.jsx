import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const VOTES = [
    { id: 'love',  label: 'Love it',  emoji: '❤️', activeClass: 'bg-rose/15 border-rose text-rose' },
    { id: 'maybe', label: 'Maybe',    emoji: '🤔', activeClass: 'bg-champagne/60 border-taupe/40 text-taupe' },
    { id: 'skip',  label: 'Skip',     emoji: '✕',  activeClass: 'bg-blush/40 border-blush text-taupe/60' },
];

const StopVoteBar = ({ planId, stopIndex, userId, voteSummary, onVote }) => {
    const stopVotes = voteSummary?.[stopIndex] || { love: 0, maybe: 0, skip: 0, myVote: null };
    const [optimisticVote, setOptimisticVote] = useState(stopVotes.myVote);
    const [submitting, setSubmitting] = useState(false);

    const handleVote = async (vote) => {
        if (submitting) return;
        setOptimisticVote(vote);
        setSubmitting(true);
        try {
            await axios.post('/api/collab/vote', { planId, stopIndex, userId, vote });
            onVote?.({ stopIndex, vote });
        } catch (err) {
            setOptimisticVote(stopVotes.myVote);
        } finally {
            setSubmitting(false);
        }
    };

    const currentVote = optimisticVote;

    return (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blush/30">
            <span className="editorial-label mr-1">Your vote</span>
            {VOTES.map(v => (
                <motion.button
                    key={v.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleVote(v.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold font-outfit transition-all ${
                        currentVote === v.id
                            ? v.activeClass
                            : 'bg-ivory border-blush text-taupe/70 hover:border-rose/30'
                    }`}
                >
                    <span className="text-sm">{v.emoji}</span>
                    <span>{v.label}</span>
                    {stopVotes[v.id] > 0 && (
                        <span className={`text-[10px] font-bold ${currentVote === v.id ? 'opacity-80' : 'opacity-50'}`}>
                            {stopVotes[v.id]}
                        </span>
                    )}
                </motion.button>
            ))}
        </div>
    );
};

export default StopVoteBar;
