import fs from 'fs';
import path from 'path';

const [, , inputPathArg, outputPathArg] = process.argv;

const inputPath = inputPathArg || 'jest-results.json';
const outputPath = outputPathArg || 'test-results.csv';

function escapeCsv(value) {
    if (value === undefined || value === null) return '';
    const s = String(value).replace(/\r?\n|\r/g, ' ').replace(/"/g, '""');
    if (s.includes(',') || s.includes('"')) return `"${s}"`;
    return s;
}

function main() {
    if (!fs.existsSync(inputPath)) {
        console.error(`Input JSON not found: ${inputPath}`);
        process.exit(1);
    }
    const raw = fs.readFileSync(inputPath, 'utf-8');
    const data = JSON.parse(raw);

    const rows = [];
    rows.push(['Test File','Test Suite','Test Name','Status','Duration (ms)','Error Message']);

    const testResults = data.testResults || [];
    for (const fileRes of testResults) {
        const testFile = path.relative(process.cwd(), fileRes.name || '');
        const suites = fileRes.testResults || [];
        for (const t of suites) {
            const testSuite = (t.ancestorTitles || []).join(' > ');
            const testName = t.title;
            const status = t.status;
            const duration = t.duration ?? '';
            const errorMessage = (t.failureMessages || []).join(' | ').replace(/\x1b\[[0-9;]*m/g, '');
            rows.push([
                testFile,
                testSuite,
                testName,
                status,
                duration,
                errorMessage
            ]);
        }
    }

    const csv = rows.map(r => r.map(escapeCsv).join(',')).join('\n') + '\n';
    fs.writeFileSync(outputPath, csv, 'utf-8');
    console.log(`CSV written: ${outputPath}`);
}

main();




