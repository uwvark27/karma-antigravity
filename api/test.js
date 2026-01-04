export const config = {
    runtime: 'edge',
};

export default function handler(request) {
    return new Response(
        JSON.stringify({
            message: 'Hello from Vercel Edge Functions!',
            time: new Date().toISOString(),
        }),
        {
            status: 200,
            headers: {
                'content-type': 'application/json',
            },
        }
    );
}
