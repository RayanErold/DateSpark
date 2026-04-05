import fs from 'fs';
import parser from '@babel/parser';

const code = fs.readFileSync('c:\\Users\\Erold Rayan\\Downloads\\Million Dollar Web app Ideas\\Date Planner app\\src\\pages\\Login.jsx', 'utf-8');

try {
    parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx']
    });
    console.log("Syntax OK");
} catch (err) {
    console.error("Syntax Error found:");
    console.error(err.message);
    if (err.loc) {
        console.error(`Line: ${err.loc.line}, Column: ${err.loc.column}`);
    }
}
