// Quem está chamando: o Cloudflare Access põe um JWT assinado em
// `Cf-Access-Jwt-Assertion` em toda requisição que passou pelo login. Aqui ele é
// verificado de novo (assinatura, emissor, audiência, validade) e o e-mail tem de
// estar na lista. Assim o servidor não confia só na borda.
import { createRemoteJWKSet, jwtVerify } from 'jose';

/**
 * @param {{ teamDomain: string, aud: string, allowedEmails: string[], jwks?: any }} cfg
 * @returns {(req: { headers: Record<string, string | string[] | undefined> }) => Promise<string | null>} e-mail ou null
 */
export function accessVerifier({ teamDomain, aud, allowedEmails, jwks }) {
	if (!teamDomain || !aud || allowedEmails.length === 0) {
		throw new Error(
			'Cloudflare Access não configurado (CF_ACCESS_TEAM_DOMAIN, CF_ACCESS_AUD, CAIXA_ALLOWED_EMAILS)'
		);
	}
	const issuer = `https://${teamDomain}`;
	const keys = jwks ?? createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
	const allowed = new Set(allowedEmails.map((e) => e.trim().toLowerCase()).filter(Boolean));
	return async (req) => {
		const token = req.headers['cf-access-jwt-assertion'];
		if (typeof token !== 'string' || !token) return null;
		try {
			const { payload } = await jwtVerify(token, keys, {
				issuer,
				audience: aud,
				algorithms: ['RS256']
			});
			const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
			return allowed.has(email) ? email : null;
		} catch {
			return null;
		}
	};
}

/** Desenvolvimento local: sem Access, um usuário fixo. */
export const localVerifier = async () => 'local@localhost';
