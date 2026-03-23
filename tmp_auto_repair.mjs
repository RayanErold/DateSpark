import fs from 'fs';
import { execSync } from 'child_process';

const code = fs.readFileSync('C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\pages\\Dashboard.jsx', 'utf-8');
const lines = code.split('\n');

function testInsert(lineNumber) {
    const copy = [...lines];
    copy.splice(lineNumber, 0, '                        </div>');
    fs.writeFileSync('C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\pages\\Dashboard_test.jsx', copy.join('\n'));
    try {
        const out = execSync('npx eslint src/pages/Dashboard_test.jsx', { stdio: 'pipe' });
        return { success: true, log: out.toString() };
    } catch (e) {
        return { success: false, log: e.stdout ? e.stdout.toString() : e.message };
    }
}

const r791 = testInsert(791);
const r834 = testInsert(834);
const r790 = testInsert(790);

const outText = `
Test 791: ${r791.success} -- ${r791.log.substring(0,200)}
Test 834: ${r834.success} -- ${r834.log.substring(0,200)}
Test 790: ${r790.success} -- ${r790.log.substring(0,200)}
`;

fs.writeFileSync('C:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\repair_results.txt', outText);
console.log("Done test insert save.");
