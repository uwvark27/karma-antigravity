import { Webhook } from 'svix';
import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'edge',
};

export default async function handler(request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!CLERK_WEBHOOK_SECRET) {
        return new Response('Missing CLERK_WEBHOOK_SECRET', { status: 500 });
    }

    // Get the headers
    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        });
    }

    // Get the body
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(CLERK_WEBHOOK_SECRET);

    let evt;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', {
            status: 400
        });
    }

    // Handle the event
    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
    console.log('Webhook body:', body);

    try {
        if (eventType === 'user.created') {
            const { id, email_addresses } = evt.data;
            // Assume the first email is the primary one
            const email = email_addresses[0]?.email_address;

            await sql`
            INSERT INTO users (id, email, role)
            VALUES (${id}, ${email}, 'member')
            ON CONFLICT (id) DO NOTHING;
        `;
            console.log(`User ${id} created in DB`);
        }
        else if (eventType === 'user.updated') {
            const { id, email_addresses } = evt.data;
            const email = email_addresses[0]?.email_address;

            await sql`
            UPDATE users 
            SET email = ${email}
            WHERE id = ${id};
        `;
            console.log(`User ${id} updated in DB`);
        }
        else if (eventType === 'user.deleted') {
            const { id } = evt.data;
            await sql`DELETE FROM users WHERE id = ${id}`;
            console.log(`User ${id} deleted from DB`);
        }

        return new Response('', { status: 200 });

    } catch (dbError) {
        console.error('Database error:', dbError);
        return new Response('Error saving user to database', { status: 500 });
    }
}
