'use client';

import Page from '@components/Page';
import ScrambleText from '@components/ScrambleText';
import { useLanguage } from '@contexts/LanguageContext';

function Home() {
	const { strings } = useLanguage();

	return (
		<Page className='flex flex-col items-center justify-start p-4 w-full h-full pt-[120px] md:pt-[40px]'>
			<h1 className='text-[50px] leading-[50px] sm:text-[75px] sm:leading-[75px] lg:text-[100px] lg:leading-[100px] text-yorha font-doto tracking-tighter font-[800]'>
				<ScrambleText
					scramble={8}
					preventLayoutShift
				>
					{strings.ui.siteTitle}
				</ScrambleText>
			</h1>
			<p className='text-yorha/60 text-sm sm:text-md font-medium'>
				<ScrambleText
					scramble={10}
					preventLayoutShift
				>
					{strings.ui.siteDescription}
				</ScrambleText>
			</p>
			<h2 className='sr-only'>Welcome to my portfolio site!</h2>
			<p className='sr-only'>
				This site is built with React, Tailwind, and ThreeJS with a main
				focus on a background scene utilizing 3D models and a moving
				camera based on the frontend UI's current state. If you're using
				a screen reader, I apologize, this site will have some
				inaccessable visuals. Check in later for a compatibility mode,
				as well as a simplicity mode for clients with graphics
				acceleration disabled!
			</p>
		</Page>
	);
}

export default Home;
