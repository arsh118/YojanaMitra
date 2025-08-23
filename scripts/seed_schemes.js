// scripts/seed_schemes.js
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const csvPath = path.join(__dirname, '../data/schemes.csv');
const outputPath = path.join(__dirname, '../data/schemes.json');

if (!fs.existsSync(csvPath)) {
  console.error('Please create data/schemes.csv first.');
  process.exit(1);
}

const csvText = fs.readFileSync(csvPath, 'utf8');
const records = parse(csvText, { 
  columns: true, 
  skip_empty_lines: true,
  quote: '"',
  escape: '"',
  delimiter: ','
});

fs.writeFileSync(outputPath, JSON.stringify(records, null, 2));
console.log('Wrote', records.length, 'schemes to data/schemes.json');
