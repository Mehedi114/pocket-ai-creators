// Rewrite only generated public output; Vercel/source metadata stays unchanged.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const origin = process.env.CLOUDFLARE_SITE_ORIGIN || 'https://pockethelper.phapps.workers.dev';
const url = new URL(origin);
if (url.protocol !== 'https:' || url.origin !== origin) throw new Error('CLOUDFLARE_SITE_ORIGIN must be an HTTPS origin without a trailing slash');
async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) await visit(file);
        else if (/\.(html|xml|txt|webmanifest)$/.test(file)) {
            const text = await readFile(file, 'utf8');
            await writeFile(file, text.replaceAll('https://pocket-helper.vercel.app', origin));
        }
    }
}
await visit('public');
console.log('Cloudflare public metadata origin:', origin);
