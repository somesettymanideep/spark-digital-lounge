import fs from "node:fs";
import path from "node:path";

const src = path.resolve(".output/public");
const dest = path.resolve("dist/client");

if (fs.existsSync(src)) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log("Successfully mirrored .output/public to dist/client");
}
