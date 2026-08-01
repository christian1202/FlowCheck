const fs = require('fs');
const files = [
  'src/app/(dashboard)/settings/page.tsx',
  'src/app/api/cron/sync-sheets/route.ts',
  'src/app/api/[[...route]]/route.ts',
  'src/app/api/test-db/route.ts',
  'src/lib/google/sheets.ts',
  'src/data/events.ts',
  'src/data/registration.ts',
  'src/data/scanner.ts',
  'src/actions/settings.ts',
  'src/actions/eventAdmins.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace import
  content = content.replace("import { db } from '@/lib/db';", "import { getDb } from '@/lib/db';");
  
  // Replace direct db usage with getDb() invocation
  // We look for function definitions that contain 'db.' and insert 'const db = getDb();' at the top.
  // A simple regex approach for async functions:
  content = content.replace(/(export\s+(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{)(?!\s*const\s+db\s*=\s*getDb\(\);)/g, '$1\n  const db = getDb();');
  
  // Also handle arrow functions assigned to variables (like Next.js route handlers if any)
  content = content.replace(/(export\s+(?:const|let)\s+\w+\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^{]+)?\s*=>\s*\{)(?!\s*const\s+db\s*=\s*getDb\(\);)/g, '$1\n  const db = getDb();');

  fs.writeFileSync(file, content);
  console.log('Refactored', file);
}
