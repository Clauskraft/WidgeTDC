import * as dotenv from 'dotenv';
import * as path from 'path';
import * as url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { getDatabaseAdapter } from '../platform/db/PrismaDatabaseAdapter.js';

async function fixVectorDimensions() {
    console.log('🔧 Fixing vector dimensions in PostgreSQL...');
    const dbAdapter = getDatabaseAdapter();
    await dbAdapter.initialize();
    const prisma = dbAdapter.getClient();

    try {
        // Alter table to use 384 dimensions
        console.log('Running: ALTER TABLE vector_documents ALTER COLUMN embedding TYPE vector(384);');
        await prisma.$executeRawUnsafe(`
            ALTER TABLE vector_documents 
            ALTER COLUMN embedding TYPE vector(384);
        `);
        console.log('✅ Successfully updated vector column dimensions to 384.');
    } catch (error: any) {
        console.error('❌ Error updating vector dimensions:', error.message);
    } finally {
        await dbAdapter.disconnect();
    }
}

fixVectorDimensions();
