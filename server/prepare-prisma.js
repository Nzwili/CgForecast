const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');

if (!fs.existsSync(schemaPath)) {
  console.error(`[ERROR] schema.prisma was not found at ${schemaPath}`);
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('=== Prisma Database Provisioning Translation ===');

if (schema.includes('provider = "sqlite"')) {
  console.log('Detecting local SQLite datasource provider...');
  
  // Replace SQLite configuration with PostgreSQL
  schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
  schema = schema.replace('url      = "file:./dev.db"', 'url      = env("DATABASE_URL")');
  
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('🔄 SUCCESS: Successfully translated Prisma Schema to PostgreSQL for Cloud Deployment.');
} else {
  console.log('ℹ️ NOTE: Schema is already configured for PostgreSQL or another database.');
}

console.log('================================================\n');
