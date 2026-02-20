import { Pool } from 'pg'
import * as dotenv from 'dotenv';
import * as path from 'path'
import { fileURLToPath } from 'url';
// Point to the correct location of .env manually
//dotenv.config({ path: path.resolve(__dirname, '../.env') }) // ✅
const __filename = fileURLToPath(import.meta.url);
const __dir = path.dirname(__filename);
dotenv.config({
  path: path.resolve(__dir, '../.env')
})


export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
