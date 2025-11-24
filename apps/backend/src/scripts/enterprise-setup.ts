#!/usr/bin/env node

/**
 * Enterprise Setup Script
 * Automates the setup of PostgreSQL, Redis, and Prisma
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const steps = [
    {
        name: 'Check Docker',
        command: 'docker --version',
        required: true,
    },
    {
        name: 'Start Docker Services',
        command: 'docker-compose up -d postgres redis',
        cwd: path.join(process.cwd(), '../..'),
    },
    {
        name: 'Install Dependencies',
        command: 'npm install',
    },
    {
        name: 'Generate Prisma Client',
        command: 'npx prisma generate',
    },
    {
        name: 'Run Database Migration',
        command: 'npx prisma migrate dev --name init',
        skipOnError: true, // Migration might already exist
    },
    {
        name: 'Build Backend',
        command: 'npm run build',
    },
];

async function run() {
    console.log('🚀 Starting Enterprise Setup...\n');

    for (const step of steps) {
        console.log(`📦 ${step.name}...`);

        try {
            const output = execSync(step.command, {
                cwd: step.cwd || process.cwd(),
                stdio: 'pipe',
                encoding: 'utf-8',
            });

            console.log(`✅ ${step.name} completed\n`);

            if (output && output.length < 500) {
                console.log(output);
            }
        } catch (error) {
            if (step.required) {
                console.error(`❌ ${step.name} failed!`);
                console.error(error.message);
                process.exit(1);
            } else if (step.skipOnError) {
                console.log(`⚠️  ${step.name} skipped (may already be complete)\n`);
            } else {
                console.error(`❌ ${step.name} failed!`);
                console.error(error.message);
                process.exit(1);
            }
        }
    }

    console.log('\n✨ Enterprise setup complete!');
    console.log('\nNext steps:');
    console.log('1. Review .env file and add your API keys');
    console.log('2. Start backend: pm2 start ecosystem.config.js');
    console.log('3. Check status: pm2 status');
    console.log('4. View logs: pm2 logs widgetdc-backend');
}

run().catch((err) => {
    console.error('Setup failed:', err);
    process.exit(1);
});
