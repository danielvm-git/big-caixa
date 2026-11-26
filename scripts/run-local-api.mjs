import http from 'node:http';
import leituraHandler from '../functions/leitura.mjs';
import escritaHandler from '../functions/escrita.mjs';

const PORT = process.env.PORT || 8787;
process.env.LOCAL_DEV = 'true';
process.env.DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://danielvm@localhost:5432/my_finances';

const server = http.createServer(async (req, res) => {
	try {
		const url = new URL(req.url, `http://${req.headers.host || 'localhost:8787'}`);
		const headers = new Headers();
		for (const [key, val] of Object.entries(req.headers)) {
			if (val) headers.set(key, Array.isArray(val) ? val.join(', ') : val);
		}

		let bodyBuffer = null;
		if (req.method === 'POST') {
			const chunks = [];
			for await (const chunk of req) chunks.push(chunk);
			bodyBuffer = Buffer.concat(chunks);
		}

		const request = new Request(url, {
			method: req.method,
			headers,
			body: bodyBuffer
		});

		const handler = req.method === 'POST' ? escritaHandler : leituraHandler;
		const response = await handler.fetch(request);
		res.statusCode = response.status;
		for (const [key, val] of response.headers.entries()) {
			res.setHeader(key, val);
		}
		// Ensure local dev CORS headers
		const reqOrigin = req.headers.origin || 'http://localhost:5173';
		res.setHeader('access-control-allow-origin', reqOrigin);
		res.setHeader('access-control-allow-headers', 'authorization, content-type');
		res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');

		console.log(`[API] ${req.method} ${req.url} -> ${response.status}`);

		if (response.status === 204) {
			res.end();
		} else {
			const body = await response.arrayBuffer();
			res.end(Buffer.from(body));
		}
	} catch (err) {
		console.error('API Error:', err);
		res.statusCode = 500;
		res.setHeader('content-type', 'application/json');
		res.end(JSON.stringify({ error: String(err) }));
	}
});

server.listen(PORT, () => {
	console.log(`Local Caixa API running at http://localhost:${PORT}`);
});
