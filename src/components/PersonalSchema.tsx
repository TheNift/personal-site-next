/**
 * Injects the schema.org Person JSON-LD script only on personal domains
 * (jackkill.com / localhost). Renders nothing on anonymous domains.
 *
 * Since this runs server-side now, the script is injected correctly before hydration
 * without relying on the client side check.
 */
export default function PersonalSchema({ isPersonal }: { isPersonal: boolean }) {
	if (!isPersonal) return null;

	return (
		<script
			type='application/ld+json'
			dangerouslySetInnerHTML={{
				__html: JSON.stringify({
					'@context': 'https://schema.org/',
					'@type': 'Person',
					name: 'Jack Kill',
					pronouns: 'He/Him',
					jobTitle: 'Software Engineer',
					height: [
						{ '@type': 'QuantitativeValue', value: '192', unitCode: 'cm', unitText: 'centimeters' },
						{ '@type': 'QuantitativeValue', value: '75', unitCode: 'in', unitText: 'inches' },
						{ '@type': 'QuantitativeValue', value: '6.25', unitCode: 'ft', unitText: 'feet' },
					],
					weight: [
						{ '@type': 'QuantitativeValue', value: '97.5', unitCode: 'kg', unitText: 'kilograms' },
						{ '@type': 'QuantitativeValue', value: '215', unitCode: 'lb', unitText: 'pounds' },
					],
					hasOccupation: [
						{ '@type': 'Role', hasOccupation: { '@type': 'Occupation', name: 'Software Engineer', occupationalCategory: '15-1252.00' }, startDate: '2024-07-01', endDate: 'present' },
						{ '@type': 'Role', hasOccupation: { '@type': 'Occupation', name: 'Technology Intern', occupationalCategory: '15-1299.09' }, startDate: '2023-07-01', endDate: '2023-08-31' },
						{ '@type': 'Role', hasOccupation: { '@type': 'Occupation', name: 'Software Engineer Intern', occupationalCategory: '15-1252.00' }, startDate: '2022-07-01', endDate: '2024-01-31' },
						{ '@type': 'Role', hasOccupation: { '@type': 'Occupation', name: 'SELF Fellow', occupationalCategory: '25-1199.00' }, startDate: '2019-08-01', endDate: '2024-05-31' },
					],
					knowsLanguage: [
						{ '@type': 'Language', name: 'English', alternateName: 'Tiếng Anh' },
						{ '@type': 'Language', name: 'Vietnamese', alternateName: 'Tiếng Việt' },
					],
					knowsAbout: [
						{ '@type': 'Thing', name: 'JavaScript' },
						{ '@type': 'Thing', name: 'TypeScript' },
						{ '@type': 'Thing', name: 'C++' },
						{ '@type': 'Thing', name: 'C' },
						{ '@type': 'Thing', name: 'Go' },
						{ '@type': 'Thing', name: 'PHP' },
						{ '@type': 'Thing', name: 'Python' },
						{ '@type': 'Thing', name: 'Java' },
						{ '@type': 'Thing', name: 'C#' },
						{ '@type': 'Thing', name: 'React', alternateName: 'Vite, Next.js, NextJS' },
						{ '@type': 'Thing', name: 'React Native', alternateName: 'React-Native, Expo' },
						{ '@type': 'Thing', name: 'Node.js', alternateName: 'NodeJS' },
						{ '@type': 'Thing', name: 'Tailwind CSS', alternateName: 'TailwindCSS' },
						{ '@type': 'Thing', name: 'MongoDB' },
						{ '@type': 'Thing', name: 'MySQL', alternateName: 'SQL' },
						{ '@type': 'Thing', name: 'Full-Stack Development', alternateName: 'Fullstack Development' },
						{ '@type': 'Thing', name: 'Frontend Development' },
						{ '@type': 'Thing', name: 'Backend Development' },
						{ '@type': 'Thing', name: 'Unity', alternateName: 'Unity Engine' },
						{ '@type': 'Thing', name: 'Unreal Engine' },
						{ '@type': 'Thing', name: 'Godot', alternateName: 'Godot Engine' },
						{ '@type': 'Thing', name: 'AWS', alternateName: 'Amazon Web Services' },
						{ '@type': 'Thing', name: 'Docker' },
						{ '@type': 'Thing', name: 'Git' },
						{ '@type': 'Thing', name: 'GitHub', alternateName: 'GitHub Actions' },
						{ '@type': 'Thing', name: 'Cloudflare', alternateName: 'Cloudflare Workers' },
						{ '@type': 'Thing', name: 'Cloudflare Pages' },
						{ '@type': 'Thing', name: 'WordPress' },
						{ '@type': 'Thing', name: 'Shopify', alternateName: 'Shopify API' },
						{ '@type': 'Thing', name: 'Liquid', alternateName: 'Liquid Template Language' },
						{ '@type': 'Thing', name: 'Selenium', alternateName: 'Selenium WebDriver' },
						{ '@type': 'Thing', name: 'REST API', alternateName: 'RESTful API' },
						{ '@type': 'Thing', name: 'UI/UX Development' },
						{ '@type': 'Thing', name: 'Linux', alternateName: 'Arch Linux, Ubuntu, Manjaro' },
						{ '@type': 'Thing', name: 'MacOS', alternateName: 'macOS' },
						{ '@type': 'Thing', name: 'Windows', alternateName: 'Windows 10, Windows 11' },
						{ '@type': 'Thing', name: 'Android', alternateName: 'Android OS' },
						{ '@type': 'Thing', name: 'iOS', alternateName: 'iOS OS' },
						{ '@type': 'Thing', name: 'xCode', alternateName: 'xCode IDE' },
						{ '@type': 'Thing', name: 'VSCode', alternateName: 'Visual Studio Code' },
						{ '@type': 'Thing', name: 'Teamwork', alternateName: 'Communication, Leadership, Collaboration' },
						{ '@type': 'Thing', name: 'Problem Solving', alternateName: 'Problem Solving, Critical Thinking' },
						{ '@type': 'Thing', name: 'Adaptability', alternateName: 'Adaptability, Flexibility' },
						{ '@type': 'Thing', name: 'Time Management', alternateName: 'Time Management, Prioritization' },
						{ '@type': 'Thing', name: 'Agile Development', alternateName: 'Agile Methodologies, Scrum' },
					],
					alumniOf: {
						'@type': 'Role',
						alumniOf: { '@type': 'EducationalOrganization', name: 'University of Kansas' },
						startDate: '2019',
						endDate: '2023',
					},
				}),
			}}
		/>
	);
}
