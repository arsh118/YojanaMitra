import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, "../data/schemes.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

console.log("✅ Seeding started...");
console.log(data);
console.log("✅ Seeding completed!");
