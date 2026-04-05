import fs from 'fs';

const filePath = "C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\components\\Hero.jsx";
let content = fs.readFileSync(filePath, 'utf8');

const searchAnchor = `{activeFeature === 'itinerary' && (\n                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">`;
const index = content.indexOf(searchAnchor);

// Use simpler indexing match triggers absolute frames anchors fixes
const searchItinerary = `activeFeature === 'itinerary' && (`;
const idx = content.indexOf(searchItinerary);

if (idx !== -1) {
    const divStart = content.indexOf('<div className="space-y-8', idx);
    
    // Find absolute closure of the activeFeature === 'itinerary' container node triggers layout fits
    const selectEnd = content.indexOf('</div>\n                                </div>\n                            )}', idx) + 38;

    if (divStart !== -1) {
        // We want to replace the whole `div` block Node triggers!
        const nextFeatureIndex = content.indexOf(`{activeFeature === 'sync' && (`, divStart);

        if (nextFeatureIndex !== -1) {
            const originalBlock = content.slice(divStart, nextFeatureIndex);

            const boxedBlock = `<div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="relative border-l-2 border-dashed border-purple-500/20 ml-14 space-y-5 pb-4">
                                        {[
                                            { time: '7:00 PM', category: 'Dinner', venue: 'L’Artusi', desc: 'Cozy Italian & Candlelight in a cozy, intimate setting.', icon: <Utensils className="w-4 h-4 text-coral" />, dot: 'bg-coral', photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80' },
                                            { time: '9:00 PM', category: 'Walk', venue: 'The High Line', desc: 'Walk off dinner on the elevated historic rail line.', icon: <Compass className="w-4 h-4 text-gold" />, dot: 'bg-gold', photoUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80' },
                                            { time: '10:30 PM', category: 'Live Music', venue: 'The Flatiron Room', desc: 'Surrounded by vintage decor & smooth jazz quartets.', icon: <Ticket className="w-4 h-4 text-navy" />, dot: 'bg-navy' }
                                        ].map((step, idx) => (
                                            <div key={idx} className="relative pl-5">
                                                {/* Left Absolute Time */}
                                                <div className="absolute -left-14 top-2 text-[10px] font-black text-gray-400 text-right w-10">
                                                    {step.time}
                                                </div>

                                                {/* Center Dot */}
                                                <div className={\`absolute -left-[7px] top-3 w-3 h-3 rounded-full border-2 border-white shadow-sm \${step.dot}\`} />

                                                {/* Right Card */}
                                                <div className="bg-white border border-gray-100 rounded-xl p-3 flex flex-col gap-2 shadow-sm transition-all hover:shadow-md">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                            {step.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-sm font-black text-navy line-clamp-1">{step.venue}</h4>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{step.category}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-gray-500 border-t border-gray-50 pt-1.5 mt-0.5 leading-relaxed">{step.desc}</p>
                                                    {step.photoUrl && (
                                                        <img src={step.photoUrl} alt={step.venue} className="rounded-lg w-full h-24 object-cover border border-gray-50 shadow-sm mt-1" />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>\n\n                            `;

            content = content.replace(originalBlock, boxedBlock);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Hero timeline reformatting successful!");
        } else {
            console.error("Could not find boundary of activeFeature === sync.");
        }
    } else {
        console.error("Could not find activeFeature itinerary container node limits.");
    }
} else {
    console.error("Could not find start index.");
}
fs.writeFileSync(filePath, content, 'utf8');
