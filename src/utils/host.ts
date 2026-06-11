export function checkIsPersonal(hostname: string): boolean {
	const domain = hostname.split(':')[0];
	return (
		domain === 'jackkill.com' ||
		domain.endsWith('.jackkill.com') ||
		domain === 'localhost' ||
		domain === '127.0.0.1'
	);
}
