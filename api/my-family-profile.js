import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'nodejs',
};

export default async function handler(request) {
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get('clerk_user_id');

    if (!clerkUserId) {
        return new Response(JSON.stringify({ error: 'Missing clerk_user_id' }), { status: 400 });
    }

    try {
        if (request.method === 'GET') {
            const { rows } = await sql`
                SELECT * FROM FAMILY_MEMBERS WHERE CLERK_USER_ID = ${clerkUserId} LIMIT 1
            `;
            if (rows.length === 0) {
                return new Response(JSON.stringify(null), { status: 200, headers: { 'content-type': 'application/json' } });
            }
            return new Response(JSON.stringify(rows[0]), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'PUT') {
            const body = await request.json();
            const { phone, website, family_image_url } = body;

            await sql`
                UPDATE FAMILY_MEMBERS
                SET
                    FAMILY_PHONE = ${phone || null},
                    FAMILY_WEBSITE = ${website || null},
                    FAMILY_IMAGE_URL = ${family_image_url || null}
                WHERE CLERK_USER_ID = ${clerkUserId}
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        return new Response('Method Not Allowed', { status: 405 });

    } catch (error) {
        console.error('my-family-profile error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
