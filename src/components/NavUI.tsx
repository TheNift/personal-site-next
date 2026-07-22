'use client';
import Link from 'next/link';
import { motion, useSpring, useTransform, AnimatePresence } from 'motion/react';
import type { MotionValue } from 'motion/react';
import {
	useCallback,
	memo,
	useMemo,
	useState,
	useRef,
	useEffect,
	startTransition,
} from 'react';
import { useLanguage } from '@contexts/LanguageContext';
import ScrambleText from '@components/ScrambleText';
import { useBackground } from '@contexts/BackgroundContext';
import { useUI } from '@/contexts/UIContext';
import { useRouter } from 'next/navigation';
import { Home, User, Briefcase, FolderOpen, Mail, Images } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ComponentType } from 'react';

// ---------- Icon map (data-driven) ----------
const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
	home: Home,
	user: User,
	briefcase: Briefcase,
	'folder-open': FolderOpen,
	mail: Mail,
	images: Images,
};

// ---------- Constants ----------
const VISIBLE_SLOTS = 5;
const HALF_VISIBLE = Math.floor(VISIBLE_SLOTS / 2);
const SLOT_HEIGHT = 48; // px per slot
const CONTAINER_HEIGHT = VISIBLE_SLOTS * SLOT_HEIGHT;
const CENTER_Y = (CONTAINER_HEIGHT - SLOT_HEIGHT) / 2;
const SCROLL_THRESHOLD = 50; // px of deltaY before a "click"
const LOCK_IN_DELAY = 400; // ms after last scroll to navigate
const SH = SLOT_HEIGHT;

// Shortest signed circular distance from `from` to `to`
function circularDelta(from: number, to: number, count: number): number {
	const raw = ((to - from) % count + count) % count;
	return raw > count / 2 ? raw - count : raw;
}

// Sub-component so each item can use useTransform hooks
const WheelNavItem = memo(function WheelNavItem({
	itemIndex,
	itemCount,
	item,
	springPos,
	isActive,
	onItemClick,
}: {
	itemIndex: number;
	itemCount: number;
	item: { text: string; to: string; icon: string };
	springPos: MotionValue<number>;
	isActive: boolean;
	onItemClick: (index: number) => void;
}) {
	const circumference = itemCount * SLOT_HEIGHT;

	const rawOffset = useTransform(springPos, (sv) => {
		let pos = (itemIndex - sv) * SLOT_HEIGHT;
		pos =
			((pos % circumference) + circumference + circumference / 2) %
				circumference -
			circumference / 2;
		return pos;
	});

	const y = useTransform(rawOffset, (ro) => ro + CENTER_Y);

	const scale = useTransform(
		rawOffset,
		[-3 * SH, -2 * SH, -SH, 0, SH, 2 * SH, 3 * SH],
		[0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4],
	);

	const opacity = useTransform(
		rawOffset,
		[-2.5 * SH, -2 * SH, -SH, 0, SH, 2 * SH, 2.5 * SH],
		[0, 0.25, 0.6, 1.0, 0.6, 0.25, 0],
	);

	const Icon = ICON_MAP[item.icon];

	return (
		<motion.div
			style={{
				y,
				scale,
				opacity,
				position: 'absolute' as const,
				left: 0,
				height: SLOT_HEIGHT,
			}}
			className={`wheel-nav-item ${isActive ? 'wheel-nav-item--active' : ''}`}
			onClick={() => onItemClick(itemIndex)}
		>
			{Icon && <Icon size={isActive ? 20 : 16} strokeWidth={1.5} />}
			<Link
				href={item.to}
				onClick={(e) => {
					e.preventDefault();
					onItemClick(itemIndex);
				}}
				draggable={false}
				className='text-inherit no-underline'
			>
				<ScrambleText
					speed={0.5}
					step={10}
					scramble={3}
					className={`leading-[1em] ${isActive ? 'text-lg font-bold' : 'text-sm'}`}
				>
					{item.text}
				</ScrambleText>
			</Link>
		</motion.div>
	);
});

function DesktopWheelNav() {
	const { setCameraPosition, currentPageIndex } = useBackground();
	const { strings } = useLanguage();
	const { setContentHidden } = useUI();
	const router = useRouter();

	const navItems = strings.ui?.nav ?? [];
	const itemCount = navItems.length;

	const scrollPosRef = useRef(currentPageIndex);
	const [actualCenter, setActualCenter] = useState(currentPageIndex);

	const springPos = useSpring(currentPageIndex, {
		stiffness: 300,
		damping: 30,
	});

	const scrollAccum = useRef(0);
	const lockInTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isScrolling = useRef(false);
	const [isWheelScrolling, setIsWheelScrolling] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Sync with external route changes (browser back, link clicks, etc.)
	useEffect(() => {
		if (itemCount === 0) return;
		const current =
			((scrollPosRef.current % itemCount) + itemCount) % itemCount;
		const delta = circularDelta(current, currentPageIndex, itemCount);
		if (delta !== 0) {
			scrollPosRef.current += delta;
			springPos.set(scrollPosRef.current);
			setActualCenter(currentPageIndex);
		}
	}, [currentPageIndex, itemCount, springPos]);

	// Navigate after lock-in
	const commitNavigation = useCallback(
		(index: number) => {
			if (!navItems[index]) return;
			startTransition(() => router.push(navItems[index].to));
			setContentHidden(false);
			isScrolling.current = false;
			setIsWheelScrolling(false);
		},
		[navItems, router, setContentHidden],
	);

	// Scroll handler
	const handleWheel = useCallback(
		(e: WheelEvent) => {
			e.preventDefault();

			if (!isScrolling.current) {
				isScrolling.current = true;
				setIsWheelScrolling(true);
				setContentHidden(true);
			}

			scrollAccum.current += e.deltaY;

			if (Math.abs(scrollAccum.current) >= SCROLL_THRESHOLD) {
				const direction = scrollAccum.current > 0 ? 1 : -1;
				scrollAccum.current = 0;

				scrollPosRef.current += direction;
				springPos.set(scrollPosRef.current);

				const newCenter =
					((scrollPosRef.current % itemCount) + itemCount) % itemCount;
				setActualCenter(newCenter);
				setCameraPosition(newCenter);

				// Reset lock-in timer
				if (lockInTimer.current) clearTimeout(lockInTimer.current);
				lockInTimer.current = setTimeout(
					() => commitNavigation(newCenter),
					LOCK_IN_DELAY,
				);
			} else {
				// Small scrolls also reset the lock-in timer
				if (lockInTimer.current) clearTimeout(lockInTimer.current);
				const center =
					((scrollPosRef.current % itemCount) + itemCount) % itemCount;
				lockInTimer.current = setTimeout(
					() => commitNavigation(center),
					LOCK_IN_DELAY,
				);
			}
		},
		[itemCount, setCameraPosition, springPos, commitNavigation, setContentHidden],
	);

	// Attach non-passive wheel listener
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		container.addEventListener('wheel', handleWheel, { passive: false });
		return () => container.removeEventListener('wheel', handleWheel);
	}, [handleWheel]);

	// Click a specific item — take the shortest path
	const handleItemClick = useCallback(
		(index: number) => {
			if (lockInTimer.current) clearTimeout(lockInTimer.current);

			const delta = circularDelta(actualCenter, index, itemCount);
			scrollPosRef.current += delta;
			springPos.set(scrollPosRef.current);

			setActualCenter(index);
			setCameraPosition(index);
			setIsWheelScrolling(false);
			commitNavigation(index);
		},
		[actualCenter, itemCount, springPos, setCameraPosition, commitNavigation],
	);

	if (itemCount === 0) return null;

	return (
		<div
			ref={containerRef}
			className='wheel-nav-container hidden md:block'
			style={{
				height: CONTAINER_HEIGHT,
				minWidth: 200,
			}}
		>
			{/* Fixed center indicator — stays in place, subtle pulse on scroll */}
			<motion.div
				className='wheel-nav-highlight'
				animate={{
					scaleX: isWheelScrolling ? 0.92 : 1,
					scaleY: isWheelScrolling ? 0.85 : 1,
					opacity: isWheelScrolling ? 0.5 : 1,
					x: 200 * -0.08
				}}
				transition={{
					type: 'spring',
					stiffness: 400,
					damping: 25,
				}}
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: CENTER_Y,
					height: SLOT_HEIGHT,
					pointerEvents: 'none',
				}}
			/>
			{navItems.map((item, itemIndex) => (
				<WheelNavItem
					key={`wheel-${itemIndex}`}
					itemIndex={itemIndex}
					itemCount={itemCount}
					item={item}
					springPos={springPos}
					isActive={itemIndex === actualCenter}
					onItemClick={handleItemClick}
				/>
			))}
		</div>
	);
}

function MobileNavUI() {
	const { strings } = useLanguage();
	const { setContentHidden } = useUI();
	const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

	const handleClick = useCallback(() => {
		setTimeout(() => {
			setIsMobileNavOpen(false);
			setContentHidden(false);
		}, 100);
	}, [setContentHidden]);

	const navItems = useMemo(
		() =>
			strings.ui.nav.map((item, index) => (
				<Link
					key={`nav-${index}-${item.to}-mobile`}
					href={item.to}
					onClick={handleClick}
					className='py-[12px] [&:not(:last-child)]:border-b-2 border-yorha-dark'
				>
					<ScrambleText>{item.text}</ScrambleText>
				</Link>
			)),
		[strings.ui.nav, handleClick],
	);

	return (
		<>
			<button
				className='w-[20px] h-[20px] absolute z-1000 bg-transparent top-[16px] right-[16px] pointer-events-auto md:hidden flex flex-col justify-center items-center'
				onClick={() => {
					setIsMobileNavOpen(!isMobileNavOpen);
				}}
			>
				<div className='w-full h-[14px] flex flex-col justify-between items-center relative'>
					<motion.span
						className='w-[80%] h-[2px] bg-yorha block origin-center rounded-full'
						animate={{
							rotate: isMobileNavOpen ? 45 : 0,
							y: isMobileNavOpen ? 6 : 0,
						}}
						transition={{ duration: 0.3 }}
					/>
					<motion.span
						className='w-[80%] h-[2px] bg-yorha block rounded-full'
						animate={{
							opacity: isMobileNavOpen ? 0 : 1,
						}}
						transition={{ duration: 0.3 }}
					/>
					<motion.span
						className='w-[80%] h-[2px] bg-yorha block origin-center rounded-full'
						animate={{
							rotate: isMobileNavOpen ? -45 : 0,
							y: isMobileNavOpen ? -6 : 0,
						}}
						transition={{ duration: 0.3 }}
					/>
				</div>
				<span className='sr-only'>Menu</span>
			</button>
			<motion.div
				initial={{ left: '-100vw' }}
				animate={{ left: isMobileNavOpen ? 0 : '-100vw' }}
				transition={{ duration: 0.3, ease: 'easeInOut' }}
				className='flex flex-col absolute z-1005 top-1/2 -translate-y-1/2 p-[16px] bg-yorha pointer-events-auto md:hidden border-2 border-yorha-dark border-l-0 shadow-[0_0_20px_rgba(0,0,0,0.9)]'
			>
				{navItems}
			</motion.div>
		</>
	);
}

function NavUI() {
	return (
		<>
			<DesktopWheelNav />
			<MobileNavUI />
		</>
	);
}

export default NavUI;

