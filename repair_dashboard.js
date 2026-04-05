import fs from 'fs';
import path from 'path';

const filePath = 'src/pages/Dashboard.jsx';

function repair(content, startMatch, endMatch, replacement) {
    const startIndex = content.indexOf(startMatch);
    if (startIndex === -1) {
        console.warn('Could not find start match: ' + startMatch.substring(0, 30));
        return content;
    }
    const searchAfterStart = content.indexOf(endMatch, startIndex + startMatch.length);
    if (searchAfterStart === -1) {
        console.warn('Could not find end match: ' + endMatch.substring(0, 30));
        return content;
    }
    const endIndex = searchAfterStart + endMatch.length;
    console.log('Repaired block starting with: ' + startMatch.substring(0, 30));
    return content.substring(0, startIndex) + replacement + content.substring(endIndex);
}

let code;
try {
    code = fs.readFileSync(filePath, 'utf8');
} catch (e) {
    console.error('Failed to read file:', e);
    process.exit(1);
}

const handleRestoreReplacement = `const handleRestorePlan = async (planId, e) => {
        e.stopPropagation();
        try {
            const response = await fetch('/api/update-plan', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    planId: planId, 
                    updateData: { deleted_at: null } 
                })
            });
            if (!response.ok) throw new Error('Proxy restore failed');
            setPlans(plans.map(p => p.id === planId ? { ...p, deleted_at: null } : p));
            alert('Plan restored to your dashboard!');
        } catch (err) {
            console.error('Error restoring plan:', err.message);
            alert(\`Restore failed: \${err.message}\`);
        }
    };

    const handleForkPlan = async (originalPlan) => {
        if (!originalPlan) return;
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const newPlan = {
                user_id: user.id,
                vibe: originalPlan.vibe,
                location: originalPlan.location,
                itinerary: originalPlan.itinerary,
                is_favorite: false,
                avg_rating: 0,
                total_tries: 0,
                reviews: [],
                vibe_tags: []
            };

            const { data, error } = await supabase
                .from('plans')
                .insert([newPlan])
                .select();

            if (error) throw error;

            setPlans(prev => [data[0], ...prev]);
            setSelectedPlan(null);
            setFeedbackMessage('Plan cloned! You can now customize it.');
            setTimeout(() => setFeedbackMessage(''), 3000);
        } catch (err) {
            console.error('Error forking plan:', err);
            setDebugError('Failed to clone plan: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };`;

code = repair(code, 
    'const handleRestorePlan = async (planId, e) => {', 
    'setIsLoading(false);\n        }\n    };',
    handleRestoreReplacement
);

const renderAccountReplacement = `const renderAccount = () => {
        const renderBackHeader = (title) => (
            <div className=\"flex items-center gap-4 mb-8\">
                <button 
                    onClick={() => setAccountSubView('menu')}
                    className=\"w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-navy hover:bg-gray-50 transition-all shadow-sm group\"
                >
                    <ChevronLeft className=\"w-5 h-5 group-hover:-translate-x-0.5 transition-transform\" />
                </button>
                <h2 className=\"text-2xl font-black text-navy tracking-tight\">{title}</h2>
            </div>
        );

        if (accountSubView === 'personal') {
            return (
                <div className=\"animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto pb-20 px-4\">
                    {renderBackHeader('Personal Information')}
                    
                    <div className=\"bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-8\">
                        <div className=\"flex flex-col items-center gap-4 py-4\">
                            <div className=\"relative group\">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} className=\"w-28 h-28 rounded-3xl object-cover shadow-xl border-4 border-white\" alt=\"Profile\" />
                                ) : (
                                    <div className=\"w-28 h-28 rounded-3xl bg-navy text-white flex items-center justify-center text-3xl font-black shadow-lg\">
                                        {user?.user_metadata?.first_name?.[0] || 'K'}
                                    </div>
                                )}
                                <label className=\"absolute -bottom-2 -right-2 w-10 h-10 bg-coral text-white rounded-xl shadow-xl flex items-center justify-center cursor-pointer hover:bg-coral/90 transition-all border-2 border-white group-hover:scale-110 active:scale-95\">
                                    {isUploading ? <Loader2 className=\"w-5 h-5 animate-spin\" /> : <Plus className=\"w-5 h-5\" />}
                                    <input type=\"file\" className=\"hidden\" onChange={handleAvatarUpload} accept=\"image/*\" disabled={isUploading} />
                                </label>
                            </div>
                            <p className=\"text-[10px] font-black text-gray-300 uppercase tracking-widest\">Update Profile Photo</p>
                        </div>

                        <div className=\"grid grid-cols-1 sm:grid-cols-2 gap-6\">
                            <div>
                                <label className=\"block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1\">First Name</label>
                                <input
                                    type=\"text\"
                                    value={profileData.first_name}
                                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                                    className=\"w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-coral focus:bg-white rounded-2xl outline-none font-bold text-navy transition-all\"
                                />
                            </div>
                            <div>
                                <label className=\"block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1\">Last Name</label>
                                <input
                                    type=\"text\"
                                    value={profileData.last_name}
                                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                                    className=\"w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-coral focus:bg-white rounded-2xl outline-none font-bold text-navy transition-all\"
                                />
                            </div>
                        </div>

                        <div>
                            <label className=\"block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1\">Email Address</label>
                            <input
                                type=\"email\"
                                value={profileData.email}
                                disabled
                                className=\"w-full px-5 py-4 bg-gray-50/50 border-2 border-transparent rounded-2xl font-bold text-gray-400 cursor-not-allowed\"
                            />
                            <p className=\"text-[10px] text-gray-400 mt-2 px-1 italic\">Email cannot be changed directly for security.</p>
                        </div>
                        <div className=\"pt-4\">
                            <button
                                onClick={handleUpdateProfile}
                                disabled={isSavingProfile}
                                className=\"w-full py-4 bg-navy text-white font-black rounded-2xl hover:bg-navy/90 active:scale-[0.98] transition-all shadow-xl shadow-navy/20 flex items-center justify-center gap-2\"
                            >
                                {isSavingProfile ? <Loader2 className=\"w-5 h-5 animate-spin\" /> : <Check className=\"w-5 h-5\" />}
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        if (accountSubView === 'billing') {
            return (
                <div className=\"animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto pb-20 px-4\">
                    {renderBackHeader('Membership & Billing')}
                    <div className={\`p-8 rounded-[2.5rem] border-2 transition-all \${isPremium ? 'border-coral/20 bg-coral/5 shadow-xl shadow-coral/5' : 'border-gray-100 bg-white shadow-sm'}\`}>
                        <div className=\"flex items-center justify-between mb-8\">
                            <div className=\"flex items-center gap-4\">
                                <div className={\`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg \${isPremium ? 'bg-navy text-white' : 'bg-gray-100 text-gray-300'}\`}>
                                    {isPremium ? <Heart className=\"w-8 h-8 fill-coral text-coral\" /> : <div className=\"text-2xl font-black italic\">F</div>}
                                </div>
                                <div>
                                    <h4 className=\"text-xl font-black text-navy\">{isPremium ? 'DateSpark Premium' : 'Free Spark Plan'}</h4>
                                    <p className=\"text-gray-500 font-bold text-xs\">{isPremium ? 'Unlimited access enabled' : 'Limited itinerary generation'}</p>
                                </div>
                            </div>
                            {!isPremium && <span className=\"bg-coral text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-lg shadow-coral/30\">Upgrade</span>}
                        </div>
                        
                        <div className=\"space-y-4 mb-8\">
                           {(isPremium ? [
                                \"Unlimited AI date generations\",
                                \"30-Day Unrestricted Access\",
                                \"Priority server processing\",
                                \"Unlock Custom App Themes\",
                                \"Full Map Interaction\"
                           ] : [
                                \"3 Free Generations / Month\",
                                \"Standard AI processing\",
                                \"Public Date Spark browsing\",
                                \"Save 3 Favorites\"
                           ]).map((f, i) => (
                               <div key={i} className=\"flex items-center gap-3\">
                                   <div className={\`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 \${isPremium ? 'bg-navy' : 'bg-gray-100'}\`}>
                                       <Check className={\`w-3.5 h-3.5 \${isPremium ? 'text-coral' : 'text-gray-400'}\`} />
                                   </div>
                                   <span className=\"text-sm font-bold text-navy/80\">{f}</span>
                               </div>
                           ))}
                        </div>

                        {isPremium ? (
                            <button 
                                onClick={handleManageSubscription}
                                className=\"w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-red-500 transition-colors border-t border-coral/10 mt-4 pt-8\"
                            >
                                Downgrade or Cancel Subscription
                            </button>
                        ) : (
                            <button onClick={() => setShowUpgradeModal(true)} className=\"w-full py-4 bg-coral text-white font-black rounded-2xl hover:bg-coral/90 transition-all shadow-xl shadow-coral/20 flex items-center justify-center gap-2\">
                                Unlock Premium Mastery
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        if (accountSubView === 'trash') {
            const trashedPlans = plans.filter(p => p.deleted_at);
            return (
                <div className=\"animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto pb-20 px-4\">
                    {renderBackHeader('Recycle Bin')}
                    <div className=\"bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm\">
                        <p className=\"text-gray-500 text-sm font-medium mb-8 text-center bg-gray-50 py-3 rounded-xl border border-gray-100 italic px-4\">
                            Favorited plans you delete are kept here for 7 days before being permanently removed.
                        </p>
                        
                        {trashedPlans.length === 0 ? (
                            <div className=\"py-20 text-center\">
                                <div className=\"w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-gray-200\">
                                    <Trash2 className=\"w-10 h-10\" />
                                </div>
                                <p className=\"text-gray-400 font-bold\">Trash is empty</p>
                            </div>
                        ) : (
                            <div className=\"space-y-4\">
                                {trashedPlans.map(plan => (
                                    <div key={plan.id} className=\"p-4 bg-gray-50/50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-coral/20 transition-all\">
                                        <div className=\"flex items-center gap-4\">
                                            <div className=\"w-12 h-12 bg-white rounded-xl flex items-center justify-center text-navy font-black text-xs border border-gray-100 shadow-sm\">
                                                {plan.location?.slice(0, 3).toUpperCase() || 'LOC'}
                                            </div>
                                            <div>
                                                <h4 className=\"font-bold text-navy text-sm\">{plan.vibe} Date</h4>
                                                <p className=\"text-[10px] text-gray-400 font-medium\">Deleted on {new Date(plan.deleted_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className=\"flex items-center gap-2\">
                                            <button onClick={(e) => handleRestorePlan(plan.id, e)} className=\"px-4 py-2 bg-white text-green-600 text-[10px] font-black rounded-xl border border-gray-100 hover:bg-green-600 hover:text-white transition-all shadow-sm\">Restore</button>
                                            <button onClick={(e) => handleDelete(plan.id, e)} className=\"px-4 py-2 bg-white text-red-600 text-[10px] font-black rounded-xl border border-gray-100 hover:bg-red-600 hover:text-white transition-all shadow-sm\">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (accountSubView === 'preferences') {
            const themes = [
                { id: 'light', name: 'Classic Day', desc: 'The original clean experience', colors: 'from-blue-50 to-white' },
                { id: 'dark', name: 'Midnight', desc: 'Deep ocean blues for night planning', colors: 'from-navy to-black' },
                { id: 'sunset', name: 'Golden Hour', desc: 'Warm palettes for romantic vibes', colors: 'from-orange-100 to-pink-50' }
            ];

            return (
                <div className=\"animate-in slide-in-from-right-4 duration-300 max-w-2xl mx-auto pb-20 px-4\">
                    {renderBackHeader('App Appearance')}
                    
                    <div className=\"bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-10\">
                        <div className=\"space-y-6\">
                            <label className=\"block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1\">Active Visual Theme</label>
                            <div className=\"grid grid-cols-1 sm:grid-cols-3 gap-4\">
                                {themes.map((t) => (
                                    <button
                                        key={t.id}
                                        onClick={() => setAppTheme(t.id)}
                                        className={\`p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden group \${appTheme === t.id ? 'border-coral shadow-lg shadow-coral/10' : 'border-gray-50 hover:border-gray-200'}\`}
                                    >
                                        <div className={\`h-12 w-full bg-gradient-to-br \${t.colors} rounded-xl mb-4 border border-black/5\`} />
                                        <h4 className={\`text-sm font-black \${appTheme === t.id ? 'text-coral' : 'text-navy'}\`}>{t.name}</h4>
                                        <p className=\"text-[10px] text-gray-400 font-bold mt-1 leading-tight\">{t.desc}</p>
                                        
                                        {appTheme === t.id && (
                                            <div className=\"absolute top-3 right-3 w-5 h-5 bg-coral rounded-full flex items-center justify-center\">
                                                <Check className=\"w-3 h-3 text-white\" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className=\"pt-6 border-t border-gray-50 flex items-center justify-between\">
                            <div className=\"flex items-center gap-5\">
                                <div className={\`w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner\`}>
                                    {appTheme === 'dark' ? <Moon className=\"w-6 h-6\" /> : <Sun className=\"w-6 h-6\" />}
                                </div>
                                <div className=\"text-left\">
                                    <p className=\"font-black text-navy\">Automatic Dark Mode</p>
                                    <p className=\"text-[11px] text-gray-400 font-medium mt-0.5\">Force dark aesthetics override</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAppTheme(appTheme === 'dark' ? 'light' : 'dark')}
                                className={\`w-14 h-7 rounded-full transition-all relative flex items-center shadow-inner \${appTheme === 'dark' ? 'bg-navy' : 'bg-gray-200'}\`}
                            >
                                <div className={\`w-5 h-5 rounded-full bg-white shadow-lg absolute transition-all \${appTheme === 'dark' ? 'left-8' : 'left-1'}\`} />
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className=\"max-w-2xl mx-auto pb-20 px-4 animate-in fade-in duration-500\">`;

code = repair(code,
    'const renderAccount = () => {',
    'return (',
    renderAccountReplacement
);

code = code.trim();
const exportMarker = 'export default Dashboard;';
if (!code.endsWith(exportMarker)) {
    const lastExportIdx = code.lastIndexOf(exportMarker);
    if (lastExportIdx !== -1) {
        code = code.substring(0, lastExportIdx + exportMarker.length);
    } else {
        code += '\\n\\nexport default Dashboard;\\n';
    }
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Dashboard repair complete (ESM version).');
