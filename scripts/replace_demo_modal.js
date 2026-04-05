import fs from 'fs';

const filePath = "C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\components\\Hero.jsx";
let content = fs.readFileSync(filePath, 'utf8');

const searchAnchor = `{/* Timeline Contents */}`;
const index = content.indexOf(searchAnchor);

if (index !== -1) {
    const divStart = content.indexOf('<div className="space-y-10 border-l-2 border-dashed', index);

    if (divStart !== -1) {
        const templateStr = `<div className="space-y-6 border-l-2 border-dashed border-purple-500/20 ml-14 relative pb-6">
                                    {DEMO_PLAN.itinerary.map((step, idx) => {
                                        const dotColors = ['bg-coral', 'bg-yellow-400', 'bg-navy'];
                                        const icons = [
                                            <Utensils className="w-5 h-5 text-coral" />,
                                            <Compass className="w-5 h-5 text-gold" />,
                                            <Ticket className="w-5 h-5 text-navy" />
                                        ];
                                        return (
                                            <div key={idx} className="relative pl-5">
                                                {/* Left Absolute Time */}
                                                <div className="absolute -left-14 top-2 text-[11px] font-black text-gray-400 text-right w-10">
                                                    {step.time}
                                                </div>

                                                {/* Center Dot */}
                                                <div className={\`absolute -left-[7px] top-3 w-3 h-3 rounded-full border-2 border-white shadow-sm \${dotColors[idx % 3]}\`} />

                                                {/* Right Card */}
                                                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3 shadow-sm transition-all hover:shadow-md">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                                                            {icons[idx % icons.length]}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-base font-black text-navy">{step.venue}</h4>
                                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{step.activity}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-500 border-t border-gray-50 pt-2 mt-1 leading-relaxed">{step.description}</p>
                                                    {step.photoUrl && (
                                                        <img src={step.photoUrl} alt={step.venue} className="rounded-xl w-full h-40 object-cover border border-gray-50 shadow-sm mt-1" />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>`;

        // Find the closure DIV tag just before `<div className="pt-4">`
        const pt4Index = content.indexOf('<div className="pt-4">', divStart);

        if (pt4Index !== -1) {
             // Look backwards for the closure </div>
             const closureIndex = content.lastIndexOf('</div>', pt4Index);

             if (closureIndex !== -1) {
                  const originalBlock = content.slice(divStart, closureIndex + 6); // include </div>
                  content = content.replace(originalBlock, templateStr);
                  fs.writeFileSync(filePath, content, 'utf8');
                  console.log("Demo modal timeline reformatting successful!");
             } else {
                  console.error("Could not find preceding </div> tag.");
             }
        } else {
             console.error("Could not find pt-4 boundary index.");
        }
    } else {
        console.error("Could not find containing timeline wrapper node.");
    }
} else {
    console.error("Could not find Timeline Contents anchor row.");
}
fs.writeFileSync(filePath, content, 'utf8');
