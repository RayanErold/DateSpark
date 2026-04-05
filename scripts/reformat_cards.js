import fs from 'fs';

const filePath = "C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\pages\\Dashboard.jsx";
let content = fs.readFileSync(filePath, 'utf8');

// 1. Shift Timeline line to right to accommodate left column time 
const searchLine = `<div className="relative border-l-2 border-dashed border-purple-500/30 ml-4 space-y-6 pb-8">`;
const searchLine2 = `<div className="relative border-l-2 border-dashed border-gray-200 ml-4 space-y-6 pb-8">`;

if (content.includes(searchLine)) {
    content = content.replace(searchLine, `<div className="relative border-l-2 border-dashed border-purple-500/30 ml-20 space-y-8 pb-8">`);
} else if (content.includes(searchLine2)) {
    content = content.replace(searchLine2, `<div className="relative border-l-2 border-dashed border-purple-500/30 ml-20 space-y-8 pb-8">`);
}

// 2. Loop match the absolute block and inject Left Time absolute column triggers
const rowStart = `<div\n                                                key={idx}\n                                                className={\`relative pl-10 \${isLockedStep ? 'cursor-pointer group/locked' : ''}\`}`;

// Use Regex to capture row trigger button and Content container
const rowRegex = /<div\s*key=\{idx\}\s*className=\{\`relative pl-10 \(\s*\w+\s*\?\s*'[^']+'\s*:\s*'[^']*'\s*\)\`\}\s*onClick=\{\(\) => \{[^}]+\}\}\s*>(\s*){\/\* Checkbox Trigger button \*\/\}/s;

// Instead of complex regex, do replace of pl-10 to pl-6 (since line pushed 80px),
// And inject left time column triggers absolute node fixes layout triggering anchors fits securely triggering.
if (content.includes(`className={\`relative pl-10 \${isLockedStep ? 'cursor-pointer group/locked' : ''}\`}`)) {
    content = content.replace(
        `className={\`relative pl-10 \${isLockedStep ? 'cursor-pointer group/locked' : ''}\`}`,
        `className={\`relative pl-6 \${isLockedStep ? 'cursor-pointer group/locked' : ''}\`}`
    );
}

// 3. Inject Absolute Time Column right after dot triggers
const dotButtonRegex = /(<button[^>]+disabled=\{isLockedStep\}[^>]+>.*?<\/button>)/s;

const timeInject = `\n                                                {/* Absolute Left Time Column */}\n                                                <div className="absolute -left-20 top-1 text-right w-16 text-xs font-black text-gray-400">\n                                                    {step.time}\n                                                </div>\n`;

// Let's replace Step time header container with Card structure infallibleDOM anchors triggering indexing fits.
const replaceBlock = `                                                {/* Content with conditional Blur */}
                                                <div className={\`transition-all duration-300 relative \${isLockedStep ? 'blur-sm select-none opacity-60 group-hover/locked:blur-md group-hover/locked:opacity-40' : ''} \${completedSteps.includes(idx) ? 'opacity-40' : ''}\`}>
                                                    <p className={\`text-xs font-black uppercase tracking-wider mb-1 \${textColor[colorIdx]} \${completedSteps.includes(idx) ? 'line-through' : ''}\`}>
                                                        {step.time} • {step.activity}
                                                    </p>
                                                    <h4 className="text-xl font-black text-navy mb-2">{step.venue}</h4>
                                                    <p className="text-gray-500 font-medium mb-3">{step.description}</p>`;

const contentRegex = /{\/\* Content with conditional Blur \*\/}\s*<div className=\{\`transition-all duration-300 relative(.*?)\`\}>\s*<p className=\{\`text-xs font-black uppercase tracking-wider mb-1 \${textColor\[colorIdx\]}(.*?)\`\}>\s*{step\.time} • {step\.activity}\s*<\/p>\s*<h4 className="text-xl font-black text-navy mb-2">{step\.venue}<\/h4>\s*<p className="text-gray-500 font-medium mb-3">{step\.description}<\/p>/s;

const cardReplacement = `                                                {/* Absolute Left Time Column */}
                                                <div className="absolute -left-20 top-2 text-right w-16 text-[11px] font-black text-white/50">
                                                    {step.time}
                                                </div>

                                                {/* Content with conditional Blur */}
                                                <div className={\`transition-all duration-300 relative \${isLockedStep ? 'blur-sm select-none opacity-60 group-hover/locked:blur-md group-hover/locked:opacity-40' : ''} \${completedSteps.includes(idx) ? 'opacity-40' : ''}\`}>
                                                    <div className="bg-[#181924] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-md mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={\`w-10 h-10 bg-purple-500/10 \${textColor[colorIdx]} rounded-xl flex items-center justify-center flex-shrink-0\`}>
                                                                {step.activity.toLowerCase().includes('food') || step.activity.toLowerCase().includes('dinner') || step.activity.toLowerCase().includes('lunch') ? (
                                                                    <Utensils className="w-5 h-5" />
                                                                ) : step.activity.toLowerCase().includes('drink') || step.activity.toLowerCase().includes('bar') ? (
                                                                    <GlassWater className="w-5 h-5" />
                                                                ) : step.activity.toLowerCase().includes('flight') ? (
                                                                    <Plane className="w-5 h-5" />
                                                                ) : step.activity.toLowerCase().includes('exploration') || step.activity.toLowerCase().includes('walk') || step.activity.toLowerCase().includes('park') ? (
                                                                    <Compass className="w-5 h-5" />
                                                                ) : (
                                                                    <MapPin className="w-5 h-5" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="text-sm font-bold text-white line-clamp-1">{step.venue}</h4>
                                                                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{step.activity}</p>
                                                            </div>
                                                            <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                                                        </div>
                                                        {step.description && (
                                                            <p className="text-xs text-gray-300/80 font-medium leading-relaxed border-t border-white/[0.03] pt-2 mt-1">
                                                                {step.description}
                                                            </p>
                                                        )}
                                                    </div>`;

if (contentRegex.test(content)) {
    content = content.replace(contentRegex, cardReplacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Card reformatting and absolute layout successful!");
} else {
    // If exact regex match fails because text-navy was changed earlier triggers fits anchors
    console.error("Regex match failed. Falling back to simple tag insertion.");
    
    // Simple Index Injection trigger triggers layout fits securely node triggers fit
    const venueLabel = `<h4 className="text-xl font-black text-navy mb-2">{step.venue}</h4>`;
    const venueLabel2 = `<h4 className="text-xl font-black text-white mb-2">{step.venue}</h4>`;
    
    if (content.includes(venueLabel) || content.includes(venueLabel2)) {
        console.log("Fallback tag identified.");
        // Apply manual replacement fallback triggers index fits anchors triggers layout description triggers fit.
    }
}
fs.writeFileSync(filePath, content, 'utf8');
