import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

// Called on login to sync a Clerk user's avatar into their Family Member record.
// Only updates FAMILY_IMAGE_URL if no custom image has been set already,
// so manually uploaded images take priority over Clerk avatars.
export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await request.json();
        const { clerk_user_id, image_url } = body;

        if (!clerk_user_id) {
            return new Response(JSON.stringify({ error: 'Missing clerk_user_id' }), { status: 400 });
        }

        // Only update if a clerk avatar URL was provided.
        // We always upsert the clerk avatar — if an admin has manually set a
        // custom FAMILY_IMAGE_URL, that column still wins visually (see Dashboard logic).
        // This endpoint only writes when there is a linked family member row.
        if (image_url) {
            await sql`
                UPDATE FAMILY_MEMBERS
                SET FAMILY_IMAGE_URL = ${image_url}
                WHERE CLERK_USER_ID = ${clerk_user_id}
                  AND (FAMILY_IMAGE_URL IS NULL OR FAMILY_IMAGE_URL = ${image_url})
            `;
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
        });

    } catch (error) {
        console.error('sync-user error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
