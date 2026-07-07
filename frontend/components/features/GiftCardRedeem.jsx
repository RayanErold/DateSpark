import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Check, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../../lib/supabase';

const PLAN_LABELS = {
    '24H':           '24-Hour Pass',
    'COUPLES_MONTH': 'Couples Plan (1 month)',
    'COUPLES_YEAR':  'Couples Plan (1 year)',
    'ELITE':         'DateSpark Plus',
};

const GiftCardRedeem = ({ onSuccess }) => {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState(null); // null | 'validating' | 'valid' | 'redeeming' | 'success' | 'error'
    const [cardInfo, setCardInfo] = useState(null);
    const [redeemedInfo, setRedeemedInfo] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const handleValidate = async () => {
        if (code.length < 8) return;
        setStatus('validating');
        setErrorMsg('');
        try {
            const { data } = await axios.get(`/api/gift-cards/validate/${code.trim()}`);
            setCardInfo(data);
            setStatus('valid');
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Invalid or expired code.');
            setStatus('error');
        }
    };

    const handleRedeem = async () => {
        setStatus('redeeming');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setErrorMsg('Please sign in to redeem your gift card.');
                setStatus('error');
                return;
            }
            const { data } = await axios.post('/api/gift-cards/redeem', { code: code.trim(), userId: user.id });
            setRedeemedInfo(data);
            setStatus('success');
            onSuccess?.();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || 'Redemption failed. Please try again.');
            setStatus('error');
        }
    };

    return (
        <div className="editorial-card p-6 w-full max-w-sm shadow-xl bg-ivory border border-blush">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-rose/10 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-rose" />
                </div>
                <div>
                    <span className="editorial-label block font-outfit text-[10px]">Redeem</span>
                    <h3 className="font-semibold text-plum font-outfit text-sm">Gift Card</h3>
                </div>
            </div>

            {status === 'success' ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4"
                >
                    {redeemedInfo?.giftCardType === 'brand' ? (
                        <div className="text-center font-outfit">
                            <div className="w-12 h-12 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-3">
                                <Check className="w-6 h-6 text-rose" />
                            </div>
                            <p className="font-bold text-plum text-sm">Voucher Claimed Successfully! 🎉</p>
                            <p className="text-taupe text-[11px] mt-1 mb-4 leading-tight">Your external brand code is ready. Copy it below to shop!</p>
                            
                            <div className="bg-[#fcf8f6] border border-blush/40 p-4 rounded-2xl text-left">
                                <p className="text-[10px] font-bold text-[#FF7F50] uppercase tracking-wider mb-2">{redeemedInfo?.brandName} Gift Card</p>
                                <p className="text-xs font-semibold text-plum mb-3">Value: <span className="text-rose font-black">${redeemedInfo?.faceValue}</span></p>
                                
                                <div className="bg-white p-2.5 rounded-xl border border-blush/20 mb-2 relative">
                                    <span className="text-[9px] text-taupe block font-semibold uppercase">Claim Code</span>
                                    <code className="text-xs font-black text-plum select-all tracking-wider">{redeemedInfo?.claimCode}</code>
                                </div>
                                
                                {redeemedInfo?.claimPin && (
                                    <div className="bg-white p-2.5 rounded-xl border border-blush/20 mb-3">
                                        <span className="text-[9px] text-taupe block font-semibold uppercase">Security PIN</span>
                                        <code className="text-xs font-black text-plum select-all tracking-wider">{redeemedInfo?.claimPin}</code>
                                    </div>
                                )}
                                
                                {redeemedInfo?.claimUrl && (
                                    <a 
                                        href={redeemedInfo.claimUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-2 bg-plum text-white font-black text-xs rounded-xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all text-center"
                                    >
                                        Redeem on {redeemedInfo.brandName}
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="w-12 h-12 rounded-full bg-rose/10 flex items-center justify-center mx-auto mb-3">
                                <Check className="w-6 h-6 text-rose" />
                            </div>
                            <p className="font-semibold text-plum font-outfit text-sm">Redeemed!</p>
                            <p className="text-taupe text-xs mt-1 leading-normal">
                                {PLAN_LABELS[cardInfo?.planType] || 'Plan'} is now active on your account.
                            </p>
                        </div>
                    )}
                </motion.div>
            ) : (
                <>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Enter gift code"
                            value={code}
                            onChange={e => {
                                setCode(e.target.value.toUpperCase());
                                setStatus(null);
                                setErrorMsg('');
                            }}
                            maxLength={16}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-blush bg-ivory text-plum placeholder:text-taupe/50 focus:outline-none focus:ring-2 focus:ring-rose/30 focus:border-rose text-sm font-outfit tracking-widest"
                        />
                        <button
                            onClick={handleValidate}
                            disabled={code.length < 8 || status === 'validating'}
                            className="px-4 py-2.5 bg-rose text-ivory rounded-xl text-sm font-semibold font-outfit disabled:opacity-40 transition-all hover:brightness-105"
                        >
                            {status === 'validating' ? '...' : 'Check'}
                        </button>
                    </div>

                    {status === 'valid' && cardInfo && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-4 p-3.5 bg-rose/5 border border-rose/15 rounded-xl text-left"
                        >
                            <p className="text-xs font-bold text-plum font-outfit">
                                {cardInfo.giftCardType === 'brand' 
                                    ? `🎁 $${cardInfo.faceValue} ${cardInfo.brandName} Gift Card`
                                    : `⚡ ${PLAN_LABELS[cardInfo.planType] || cardInfo.planType}`
                                }
                            </p>
                            {cardInfo.message && (
                                <p className="text-[11px] text-taupe mt-1 italic font-serif leading-tight">"{cardInfo.message}"</p>
                            )}
                        </motion.div>
                    )}

                    {(status === 'error') && (
                        <div className="flex items-center gap-2 mb-4 text-red-500 text-xs font-medium">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {status === 'valid' && (
                        <button
                            onClick={handleRedeem}
                            disabled={status === 'redeeming'}
                            className="btn-primary w-full text-sm flex items-center justify-center gap-1.5"
                        >
                            {status === 'redeeming' ? 'Redeeming...' : 'Redeem Gift Card'}
                            <Gift className="w-4 h-4" />
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default GiftCardRedeem;
