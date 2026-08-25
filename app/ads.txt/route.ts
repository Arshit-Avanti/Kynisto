export function GET() {
  return new Response("google.com, pub-9178031569606873, DIRECT, f08c47fec0942fa0\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
