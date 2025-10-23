import fs from 'fs';
import path from 'path';
import markdownpdf from 'markdown-pdf';

const input = path.resolve(process.cwd(), 'PROJECT_DOCUMENTATION.md');
const outDir = path.resolve(process.cwd(), 'docs');
const outFile = path.join(outDir, 'PROJECT_DOCUMENTATION.pdf');

if (!fs.existsSync(input)) {
  console.error('Input markdown not found:', input);
  process.exit(1);
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

console.log('Generating PDF at', outFile);

markdownpdf()
  .from(input)
  .to(outFile, function () {
    console.log('PDF generated:', outFile);
  });
