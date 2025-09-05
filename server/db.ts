import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

// Prioritize Coolify database if available, fallback to local DATABASE_URL
const databaseUrl = process.env.COOLIFY_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or COOLIFY_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('🔧 Initializing database connection...');
console.log('🔧 Using database:', databaseUrl.includes('coolify') || databaseUrl.includes('148.135') ? 'Coolify PostgreSQL' : 'Local PostgreSQL');
console.log('🔧 Database URL check:', databaseUrl.substring(0, 30) + '...');

// Force fresh connection pool to recognize updated CASCADE constraints
export const pool = new Pool({ 
  connectionString: databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: databaseUrl.includes('148.135') ? { rejectUnauthorized: false } : false, // SSL for Coolify
});

export const db = drizzle(pool, { schema });
