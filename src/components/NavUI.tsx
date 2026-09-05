'use client';
import Link from 'next/link';
import { motion, useSpring, useTransform } from 'motion/react';
import type { MotionValue } from 'motion/react';
import {
	useCallback,
	memo,
	useState,
	useRef,
	useEffect,
	startTransition,
	createElement,
} from 'react';
import { useLanguage } from '@contexts/LanguageContext';
import ScrambleText from '@components/ScrambleText';
import { useBackground } from '@contexts/BackgroundContext';
import { useUI } from '@/contexts/UIContext';
import { useRouter } from 'next/navigation';
import { Home, User, Briefcase, FolderOpen, Mail, Images, Gamepad } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ComponentType } from 'react';

// ---------- Icon map ----------
function getIcon(name?: string): ComponentType<LucideProps> | undefined {
	if (!name) return undefined;
	const normalized = name.toLowerCase().replace(/_/g, '-');
	switch (normalized) {
		case 'home':
			return Home;
		case 'user':
			return User;
		case 'briefcase':
			return Briefcase;
		case 'folder-open':
			return FolderOpen;
		case 'mail':
			return Mail;
		case 'images':
			return Images;
		case 'gamepad':
			return Gamepad;
		default:
			return undefined;
	}
}

// ---------- Constants ----------
const VISIBLE_SLOTS = 5;
const SLOT_HEIGHT = 48;
const CONTAINER_HEIGHT = VISIBLE_SLOTS * SLOT_HEIGHT;
const CENTER_Y = (CONTAINER_HEIGHT - SLOT_HEIGHT) / 2;
const SCROLL_THRESHOLD = 50;
const LOCK_IN_DELAY = 400;

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
		[-3 * SLOT_HEIGHT, -2 * SLOT_HEIGHT, -SLOT_HEIGHT, 0, SLOT_HEIGHT, 2 * SLOT_HEIGHT, 3 * SLOT_HEIGHT],
		[0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4],
	);

	const opacity = useTransform(
		rawOffset,
		[-2.5 * SLOT_HEIGHT, -2 * SLOT_HEIGHT, -SLOT_HEIGHT, 0, SLOT_HEIGHT, 2 * SLOT_HEIGHT, 2.5 * SLOT_HEIGHT],
		[0, 0.25, 0.6, 1.0, 0.6, 0.25, 0],
	);

	const iconComponent = getIcon(item.icon);

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
			{iconComponent &&
				createElement(iconComponent, {
					size: isActive ? 20 : 16,
					strokeWidth: 1.5,
					className: 'shrink-0',
				})}
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

				if (lockInTimer.current) clearTimeout(lockInTimer.current);
				lockInTimer.current = setTimeout(
					() => commitNavigation(newCenter),
					LOCK_IN_DELAY,
				);
			} else {
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

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		container.addEventListener('wheel', handleWheel, { passive: false });
		return () => container.removeEventListener('wheel', handleWheel);
	}, [handleWheel]);

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

// ---------- Mobile Horizontal Wheel Constants ----------
const MOBILE_SLOT_WIDTH = 145;
const MOBILE_DRAG_THRESHOLD = 30;

const MobileWheelNavItem = memo(function MobileWheelNavItem({
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
	const circumference = itemCount * MOBILE_SLOT_WIDTH;

	const rawOffset = useTransform(springPos, (sv) => {
		let pos = (itemIndex - sv) * MOBILE_SLOT_WIDTH;
		pos =
			((pos % circumference) + circumference + circumference / 2) %
				circumference -
			circumference / 2;
		return pos;
	});

	const x = useTransform(rawOffset, (ro) => ro - MOBILE_SLOT_WIDTH / 2);

	const scale = useTransform(
		rawOffset,
		[-3 * MOBILE_SLOT_WIDTH, -2 * MOBILE_SLOT_WIDTH, -MOBILE_SLOT_WIDTH, 0, MOBILE_SLOT_WIDTH, 2 * MOBILE_SLOT_WIDTH, 3 * MOBILE_SLOT_WIDTH],
		[0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4],
	);

	const opacity = useTransform(
		rawOffset,
		[-2.5 * MOBILE_SLOT_WIDTH, -2 * MOBILE_SLOT_WIDTH, -MOBILE_SLOT_WIDTH, 0, MOBILE_SLOT_WIDTH, 2 * MOBILE_SLOT_WIDTH, 2.5 * MOBILE_SLOT_WIDTH],
		[0, 0.25, 0.6, 1.0, 0.6, 0.25, 0],
	);

	const iconComponent = getIcon(item.icon);

	return (
		<motion.div
			style={{
				x,
				scale,
				opacity,
				position: 'absolute' as const,
				top: 0,
				width: MOBILE_SLOT_WIDTH,
			}}
			className={`mobile-wheel-item ${isActive ? 'mobile-wheel-item--active' : ''}`}
			onClick={() => onItemClick(itemIndex)}
		>
			{iconComponent &&
				createElement(iconComponent, {
					size: isActive ? 20 : 16,
					strokeWidth: 1.5,
					className: 'shrink-0',
				})}
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
					className={`leading-[1em] ${isActive ? 'text-sm font-bold' : 'text-xs'}`}
				>
					{item.text}
				</ScrambleText>
			</Link>
		</motion.div>
	);
});

function MobileWheelNav() {
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

	const dragAccum = useRef(0);
	const lockInTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isDragging = useRef(false);
	const [isDraggingState, setIsDraggingState] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const dragStartX = useRef(0);
	const hasMoved = useRef(false);

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

	const commitNavigation = useCallback(
		(index: number) => {
			if (!navItems[index]) return;
			startTransition(() => router.push(navItems[index].to));
			setContentHidden(false);
			isDragging.current = false;
			setIsDraggingState(false);
		},
		[navItems, router, setContentHidden],
	);

	const advanceWheel = useCallback(
		(direction: number) => {
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
		},
		[itemCount, setCameraPosition, springPos, commitNavigation],
	);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			isDragging.current = true;
			hasMoved.current = false;
			dragStartX.current = e.clientX;
			dragAccum.current = 0;
			(e.target as HTMLElement).setPointerCapture?.(e.pointerId);

			if (!isDraggingState) {
				setIsDraggingState(true);
				setContentHidden(true);
			}
		},
		[isDraggingState, setContentHidden],
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			if (!isDragging.current) return;
			const deltaX = e.clientX - dragStartX.current;

			if (Math.abs(deltaX) > 5) {
				hasMoved.current = true;
			}

			dragAccum.current = deltaX;

			if (Math.abs(dragAccum.current) >= MOBILE_DRAG_THRESHOLD) {
				const direction = dragAccum.current < 0 ? 1 : -1;
				dragStartX.current = e.clientX;
				dragAccum.current = 0;
				advanceWheel(direction);
			}
		},
		[advanceWheel],
	);

	const handlePointerUp = useCallback(() => {
		isDragging.current = false;

		if (!hasMoved.current) {
			setIsDraggingState(false);
			setContentHidden(false);
		}
		hasMoved.current = false;
	}, [setContentHidden]);

	const handleItemClick = useCallback(
		(index: number) => {
			if (lockInTimer.current) clearTimeout(lockInTimer.current);

			const delta = circularDelta(actualCenter, index, itemCount);
			scrollPosRef.current += delta;
			springPos.set(scrollPosRef.current);

			setActualCenter(index);
			setCameraPosition(index);
			setIsDraggingState(false);
			commitNavigation(index);
		},
		[actualCenter, itemCount, springPos, setCameraPosition, commitNavigation],
	);

	if (itemCount === 0) return null;

	return (
		<div
			ref={containerRef}
			className='mobile-wheel-container md:hidden'
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerUp}
		>
			<motion.div
				className='mobile-wheel-highlight'
				animate={{
					scaleY: isDraggingState ? 0.92 : 1,
					scaleX: isDraggingState ? 0.85 : 1,
					opacity: isDraggingState ? 0.5 : 1,
					y: 48 * -0.08,
				}}
				transition={{
					type: 'spring',
					stiffness: 400,
					damping: 25,
				}}
				style={{
					position: 'absolute',
					left: '50%',
					marginLeft: -MOBILE_SLOT_WIDTH / 2,
					top: 0,
					bottom: 0,
					width: MOBILE_SLOT_WIDTH,
				}}
			/>
			<div
				style={{
					position: 'relative',
					width: '100%',
					height: '100%',
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: '50%',
						top: 0,
						height: '100%',
					}}
				>
					{navItems.map((item, itemIndex) => (
						<MobileWheelNavItem
							key={`mobile-wheel-${itemIndex}`}
							itemIndex={itemIndex}
							itemCount={itemCount}
							item={item}
							springPos={springPos}
							isActive={itemIndex === actualCenter}
							onItemClick={handleItemClick}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function NavUI() {
	return (
		<>
			<DesktopWheelNav />
			<MobileWheelNav />
		</>
	);
}

export default NavUI;


