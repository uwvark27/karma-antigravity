import { put } from '@vercel/blob';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(request) {
    try {
        if (request.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        const url = new URL(request.url);
        const filename = url.searchParams.get('filename') || `upload-${Date.now()}.png`;

        // Using standard put() from vercel blob.
        // The raw file binary is sent as the request.body
        const blob = await put(filename, request.body, {
            access: 'public',
            allowOverwrite: true,
        });

        return new Response(JSON.stringify(blob), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });

    } catch (error) {
        console.error('Vercel Blob Upload Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
