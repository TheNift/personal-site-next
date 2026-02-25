"use client";
import { motion, AnimatePresence } from 'motion/react';
import { useBackground } from '@contexts/BackgroundContext';
import { usePathname } from 'next/navigation';

function Page({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	const pathname = usePathname();
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
			className={`w-full h-full`}
		>
			<AnimatePresence mode="wait">
				<div
					key={pathname || '/'}
					className={`w-full h-full ${className}`}
				>
					{children}
				</div>
			</AnimatePresence>
		</motion.div>
	);
}

export default Page;
