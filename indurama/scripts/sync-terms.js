const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '..', 'src', 'documents', 'terms', 'terms.md');
const tsPath = path.join(__dirname, '..', 'src', 'documents', 'terms', 'termsText.ts');

try {
  const md = fs.readFileSync(mdPath, 'utf8');
  // Usar JSON.stringify para manejar todos los escapes correctamente
  const tsContent = `export const TERMS_TEXT = ${JSON.stringify(md)};
`;
  fs.writeFileSync(tsPath, tsContent, 'utf8');
  console.log('Synchronized termsText.ts from terms.md');
} catch (err) {
  console.error('Error syncing terms:', err);
  process.exit(1);
}
