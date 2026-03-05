"use client";
import { motion } from 'motion/react';
import { useBackground } from '@contexts/BackgroundContext';

function Page({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const { isAssetsLoading } = useBackground();
	return (
		<motion.div
			initial={{ opacity: isAssetsLoading ? 1 : 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{
				duration: 0.3,
				ease: 'easeInOut',
			}}
			className={`w-full h-full ${className}`}
		>
			{children}
		</motion.div>
	);
}

export default Page;
