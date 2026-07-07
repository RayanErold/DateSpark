import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, EyeOff, Link2, Check, X, Send } from 'lucide-react';
import axios from 'axios';

const CollabInvitePanel = ({ plan, userId, onClose, isPremium }) => {
    const [partnerEmail, setPartnerEmail] = useState('');
    const [isSurpriseMode, setIsSurpriseMode] = useState(false);
    const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
    const [inviteLink, setInviteLink] = useState(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async () => {
        if (!partnerEmail) return;
        setStatus('sending');
        setError('');
        try {
            const { data } = await axios.post('/api/collab/invite', {
                planId: plan.id,
                ownerId: userId,
                partnerEmail,
                isSurpriseMode,
            });
            setInviteLink(data.inviteLink);
            setStatus('sent');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send invite. Try again.');
            setStatus('error');
        }
    };

    const handleCopyLink = async () => {
        if (!inviteLink) return;
        await navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isPremium) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="editorial-card p-6 max-w-sm"
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-rose/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-rose" />
                    </div>
                    <h3 className="font-semibold text-plum font-outfit">Plan with Partner</h3>
                </div>
                <p className="text-taupe text-sm mb-5">Partner collaboration is available on the Couples plan.</p>
                <a href="/pricing" className="btn-primary text-xs">Upgrade to Couples</a>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="editorial-card p-6 max-w-sm w-full"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-rose/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-rose" />
                    </div>
                    <div>
                        <span className="editorial-label block">Partner Collab</span>
                        <h3 className="font-semibold text-plum text-sm font-outfit">Plan with Partner</h3>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="w-7 h-7 rounded-full bg-blush/40 flex items-center justify-center text-taupe hover:text-rose transition-colors">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {status !== 'sent' ? (
                <>
                    {/* Email input */}
                    <div className="mb-4">
                        <label className="editorial-label mb-2 block">Partner's Email</label>
                        <input
                            type="email"
                            placeholder="partner@email.com"
                            value={partnerEmail}
                            onChange={e => setPartnerEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-blush bg-ivory text-plum placeholder:text-taupe/40 focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose text-sm"
                        />
                    </div>

                    {/* Surprise Mode toggle */}
                    <button
                        onClick={() => setIsSurpriseMode(v => !v)}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all mb-5 ${
                            isSurpriseMode
                                ? 'bg-rose/10 border-rose/30'
                                : 'bg-ivory border-blush hover:border-rose/30'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            {isSurpriseMode ? <EyeOff className="w-4 h-4 text-rose" /> : <Eye className="w-4 h-4 text-taupe" />}
                            <div className="text-left">
                                <p className={`text-sm font-semibold font-outfit ${isSurpriseMode ? 'text-rose' : 'text-plum'}`}>Surprise Mode</p>
                                <p className="text-xs text-taupe/70 mt-0.5">Partner joins but can't see stops until date night</p>
                            </div>
                        </div>
                        <div className={`w-10 h-5.5 rounded-full border flex items-center px-0.5 transition-all ${
                            isSurpriseMode ? 'bg-rose border-rose' : 'bg-blush border-blush'
                        }`}>
                            <motion.div
                                layout
                                className={`w-4 h-4 rounded-full bg-ivory shadow-sm`}
                                style={{ marginLeft: isSurpriseMode ? 'auto' : '0' }}
                            />
                        </div>
                    </button>

                    {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

                    <button
                        onClick={handleSend}
                        disabled={!partnerEmail || status === 'sending'}
                        className="btn-primary w-full text-xs disabled:opacity-40"
                    >
                        <Send className="w-4 h-4" />
                        {status === 'sending' ? 'Sending...' : 'Send Invite'}
                    </button>
                </>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {/* Success state */}
                    <div className="flex items-center gap-3 p-4 bg-rose/8 border border-rose/20 rounded-2xl mb-4">
                        <div className="w-8 h-8 rounded-full bg-rose/15 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-rose" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-plum font-outfit">Invite sent to {partnerEmail}</p>
                            {isSurpriseMode && (
                                <p className="text-xs text-taupe mt-0.5">🎁 Surprise mode is on — they'll join but won't see the stops.</p>
                            )}
                        </div>
                    </div>

                    {/* Copy link fallback */}
                    <p className="editorial-label mb-2">Or share link directly</p>
                    <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-2 p-3 rounded-xl border border-blush bg-ivory hover:bg-blush/20 transition-all text-sm text-taupe font-outfit"
                    >
                        {copied ? <Check className="w-4 h-4 text-rose flex-shrink-0" /> : <Link2 className="w-4 h-4 flex-shrink-0" />}
                        <span className="truncate text-xs">{copied ? 'Copied!' : inviteLink}</span>
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
};

export default CollabInvitePanel;
