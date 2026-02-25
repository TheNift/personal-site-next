"use client";

import Page from '@components/Page';
import { useLanguage } from '@contexts/LanguageContext';
import ScrambleText from '@components/ScrambleText';
import { AnimatePresence, motion } from 'motion/react';
import moment from 'moment';
import { useCallback, useState, useEffect } from 'react';

function About() {
	const { strings } = useLanguage();
	return (
		<Page className="flex flex-col items-center justify-start p-4 w-full h-full relative">
			<div className="w-full h-[60vh] md:h-full flex flex-col items-center justify-start [mask-image:linear-gradient(to_bottom,black_calc(100%-96px),transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_calc(100%-96px),transparent_100%)] md:[mask-image:none] md:[-webkit-mask-image:none]">
				<h1 className="text-[50px] sm:text-[75px] lg:text-[100px] mb-2 text-yorha font-doto font-[800]">
					<ScrambleText scramble={8} preventLayoutShift>
						{strings.about.title}
					</ScrambleText>
				</h1>
				<AboutCards />
			</div>
		</Page>
	);
}

function AboutCards() {
	const { strings } = useLanguage();
	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 overflow-y-auto overflow-x-hidden gap-[30px] items-stretch lg:ml-[304px]">
			{Object.entries(strings.about.items).map(([key, section], index) => (
				<AnimatePresence mode="wait" key={key}>
					<AboutCard title={section.title} items={section.content} index={index} />
				</AnimatePresence>
			))}
			<hr className="h-[50px] bg-transparent text-transparent" />
		</div>
	);
}

function AboutCard({
	title,
	items,
	index,
}: {
	title: string;
	items: any;
	index: number;
}) {
	if (Array.isArray(items)) {
		return (
			<motion.div
				className="flex flex-col justify-start align-start text-yorha w-120 h-full"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{
					duration: 0.3,
					ease: 'easeInOut',
					delay: index * 0.1,
				}}
			>
				<h2 className="text-2xl font-bold font-jetbrains-mono">
					<ScrambleText preventLayoutShift>{title}</ScrambleText>
				</h2>
				<ul className="list-disc list-inside mt-2">
					{items.map((item: string) => (
						<li className="text-sm sm:text-md" key={item}>
							<ScrambleText
								speed={1}
								step={4}
								scramble={2}
								overdrive={true}
							>
								{item}
							</ScrambleText>
						</li>
					))}
				</ul>
			</motion.div>
		);
	} else {
		return (
			<motion.div
				className="flex flex-col justify-start align-start text-yorha w-120 h-full"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{
					duration: 0.3,
					ease: 'easeInOut',
					delay: index * 0.1,
				}}
			>
				<h2 className="text-2xl font-bold mb-2 font-jetbrains-mono">
					<ScrambleText preventLayoutShift>{title}</ScrambleText>
				</h2>
				<ul className="list-disc list-inside">
					{Object.entries(items).map(([key, entry]) => {
						const isTitleValue =
							typeof entry === 'object' &&
							entry !== null &&
							'title' in entry &&
							'value' in entry;
						const label = isTitleValue ? (entry as { title: string; value: string }).title : key;
						const content = isTitleValue ? (entry as { title: string; value: string }).value : (entry as string);
						return (
							<li className="text-sm" key={key}>
								<span className="font-bold">
									<ScrambleText
										speed={1}
										step={4}
										scramble={2}
										overdrive={true}
									>
										{label}
									</ScrambleText>
									:
								</span>{' '}
								{key.toLowerCase() === 'age' ? (
									CalculateAge(content)()
								) : key.toLowerCase() === 'years of experience' ? (
									CalculatePreciseAge(content)()
								) : (
									<ScrambleText
										speed={1}
										step={4}
										scramble={2}
										overdrive={true}
									>
										{content}
									</ScrambleText>
								)}
							</li>
						);
					})}
				</ul>
			</motion.div>
		);
	}
}

function CalculateAge(value: string) {
	const [isMounted, setIsMounted] = useState(false);
	
	useEffect(() => {
		setIsMounted(true);
	}, []);

	return useCallback(() => {
		if (!isMounted) return moment('2025-01-01T00:00:00Z').diff(value, 'years', false).toString();
		return moment().diff(value, 'years', false).toString();
	}, [value, isMounted]);
}

function CalculatePreciseAge(value: string) {
	const [isMounted, setIsMounted] = useState(false);
	const [currentTime, setCurrentTime] = useState(() => moment('2025-01-01T00:00:00Z'));

	useEffect(() => {
		setCurrentTime(moment());
		setIsMounted(true);
		
		const interval = setInterval(() => {
			setCurrentTime(moment());
		}, 30);

		return () => clearInterval(interval);
	}, []);

	return useCallback(() => {
		if (!isMounted) return moment('2025-01-01T00:00:00Z').diff(value, 'years', true).toFixed(9).toString();
		return currentTime.diff(value, 'years', true).toFixed(9).toString();
	}, [value, currentTime, isMounted]);
}

export default About;
