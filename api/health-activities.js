import { sql } from '@vercel/postgres';

export const config = {
    runtime: 'nodejs', // Using edge prevents max-duration limits for large GPX uploads
};

export default async function handler(request) {
    try {
        const url = new URL(request.url);

        if (request.method === 'GET') {
            // Heal the column structure since 50 varchar isn't enough for raw GPX XML payloads
            await sql`ALTER TABLE calendars ALTER COLUMN calendar_gpx TYPE TEXT`;
            await sql`SELECT setval(pg_get_serial_sequence('CALENDARS', 'calendar_id'), coalesce(max(calendar_id),0) + 1, false) FROM CALENDARS`;

            // Only fetch Health events via the overloading structure
            const { rows } = await sql`
                SELECT * FROM CALENDARS 
                WHERE CALENDAR_NAME = 'HEALTH' 
                ORDER BY CALENDAR_DATE DESC
            `;
            return new Response(JSON.stringify(rows), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'POST') {
            const body = await request.json();
            const { member, place, subname, date, distance, duration, event_name, event_desc, gpx } = body;

            await sql`
                INSERT INTO CALENDARS 
                (CALENDAR_MEMBER, PLACE_ID, CALENDAR_NAME, CALENDAR_SUBNAME, CALENDAR_DATE, CALENDAR_NUM, CALENDAR_NUM2, CALENDAR_EVENT_NAME, CALENDAR_EVENT_DESC, CALENDAR_GPX)
                VALUES 
                (${member || 1}, ${place || null}, 'HEALTH', ${subname}, ${date}, ${distance || null}, ${duration || null}, ${event_name || null}, ${event_desc || null}, ${gpx || null})
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 201,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'PUT') {
            const body = await request.json();
            const { id, member, place, subname, date, distance, duration, event_name, event_desc, gpx } = body;

            await sql`
                UPDATE CALENDARS
                SET CALENDAR_MEMBER = ${member || 1},
                    PLACE_ID = ${place || null},
                    CALENDAR_SUBNAME = ${subname},
                    CALENDAR_DATE = ${date},
                    CALENDAR_NUM = ${distance || null},
                    CALENDAR_NUM2 = ${duration || null},
                    CALENDAR_EVENT_NAME = ${event_name || null},
                    CALENDAR_EVENT_DESC = ${event_desc || null},
                    CALENDAR_GPX = ${gpx || null}
                WHERE CALENDAR_ID = ${id} AND CALENDAR_NAME = 'HEALTH'
            `;
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        if (request.method === 'DELETE') {
            const id = url.searchParams.get('id');
            await sql`DELETE FROM CALENDARS WHERE CALENDAR_ID = ${id} AND CALENDAR_NAME = 'HEALTH'`;
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        }

        return new Response('Method Not Allowed', { status: 405 });

    } catch (error) {
        console.error('Database Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
        });
    }
}
