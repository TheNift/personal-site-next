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

const ICONS: Record<string, ComponentType<LucideProps>> = {
	home: Home,
	user: User,
	briefcase: Briefcase,
	'folder-open': FolderOpen,
	mail: Mail,
	images: Images,
	gamepad: Gamepad,
};

function getIcon(name?: string): ComponentType<LucideProps> | undefined {
	if (!name) return undefined;
	return ICONS[name.toLowerCase().replace(/_/g, '-')];
}

type NavItem = { text: string; to: string; icon: string };

const EMPTY_NAV: NavItem[] = [];

const VISIBLE_SLOTS = 5;
const SLOT_HEIGHT = 48;
const CONTAINER_HEIGHT = VISIBLE_SLOTS * SLOT_HEIGHT;
const CENTER_Y = (CONTAINER_HEIGHT - SLOT_HEIGHT) / 2;
const SCROLL_THRESHOLD = 50;
const LOCK_IN_DELAY = 400;
const MOBILE_SLOT_WIDTH = 145;
const MOBILE_DRAG_THRESHOLD = 30;
const TAP_SLOP = 8;

const HIGHLIGHT_TRANSITION = {
	type: 'spring',
	stiffness: 400,
	damping: 25,
} as const;

const DESKTOP_HIGHLIGHT_VARIANTS = {
	idle: { scaleX: 1, scaleY: 1, opacity: 1, x: 200 * -0.08 },
	interacting: { scaleX: 0.92, scaleY: 0.85, opacity: 0.5, x: 200 * -0.08 },
};

const MOBILE_HIGHLIGHT_VARIANTS = {
	idle: { scaleY: 1, scaleX: 1, opacity: 1, y: 48 * -0.08 },
	interacting: { scaleY: 0.92, scaleX: 0.85, opacity: 0.5, y: 48 * -0.08 },
};

const AXIS_CONFIG = {
	y: {
		slotSize: SLOT_HEIGHT,
		offset: CENTER_Y,
		slotClass: 'wheel-nav-slot',
		itemClass: 'wheel-nav-item',
		activeClass: 'wheel-nav-item--active',
		iconSize: [20, 16],
		textClass: ['text-lg font-bold', 'text-sm'],
		slotStyle: { left: 0, height: SLOT_HEIGHT },
	},
	x: {
		slotSize: MOBILE_SLOT_WIDTH,
		offset: -MOBILE_SLOT_WIDTH / 2,
		slotClass: 'mobile-wheel-slot',
		itemClass: 'mobile-wheel-item',
		activeClass: 'mobile-wheel-item--active',
		iconSize: [20, 16],
		textClass: ['text-sm font-bold', 'text-xs'],
		slotStyle: { top: 0, width: MOBILE_SLOT_WIDTH },
	},
};

function wrapIndex(n: number, count: number): number {
	return ((n % count) + count) % count;
}

// Shortest signed circular distance from `from` to `to`
function circularDelta(from: number, to: number, count: number): number {
	const raw = ((to - from) % count + count) % count;
	return raw > count / 2 ? raw - count : raw;
}

function useWheelNav() {
	const { setCameraPosition, currentPageIndex } = useBackground();
	const { strings } = useLanguage();
	const { setContentHidden } = useUI();
	const router = useRouter();

	const navItems = strings.ui?.nav ?? EMPTY_NAV;
	const itemCount = navItems.length;

	const scrollPosRef = useRef(currentPageIndex);
	const [actualCenter, setActualCenter] = useState(currentPageIndex);
	const [isInteracting, setIsInteracting] = useState(false);
	const isInteractingRef = useRef(false);
	const lockInTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const springPos = useSpring(currentPageIndex, {
		stiffness: 300,
		damping: 30,
	});

	useEffect(() => {
		if (itemCount === 0) return;
		const current = wrapIndex(scrollPosRef.current, itemCount);
		const delta = circularDelta(current, currentPageIndex, itemCount);
		if (delta !== 0) {
			scrollPosRef.current += delta;
			springPos.set(scrollPosRef.current);
			setActualCenter(currentPageIndex);
		}
	}, [currentPageIndex, itemCount, springPos]);

	useEffect(() => {
		return () => {
			if (lockInTimer.current) clearTimeout(lockInTimer.current);
		};
	}, []);

	const currentIndex = useCallback(
		() => wrapIndex(scrollPosRef.current, itemCount),
		[itemCount],
	);

	const beginInteraction = useCallback(() => {
		if (isInteractingRef.current) return;
		isInteractingRef.current = true;
		setIsInteracting(true);
		setContentHidden(true);
	}, [setContentHidden]);

	const endInteraction = useCallback(() => {
		isInteractingRef.current = false;
		setIsInteracting(false);
		setContentHidden(false);
	}, [setContentHidden]);

	const commitNavigation = useCallback(
		(index: number) => {
			if (!navItems[index]) return;
			startTransition(() => router.push(navItems[index].to));
			endInteraction();
		},
		[navItems, router, endInteraction],
	);

	const clearLockIn = useCallback(() => {
		if (lockInTimer.current) {
			clearTimeout(lockInTimer.current);
			lockInTimer.current = null;
		}
	}, []);

	const scheduleLockIn = useCallback(
		(index: number) => {
			clearLockIn();
			lockInTimer.current = setTimeout(
				() => commitNavigation(index),
				LOCK_IN_DELAY,
			);
		},
		[clearLockIn, commitNavigation],
	);

	const advance = useCallback(
		(direction: number) => {
			scrollPosRef.current += direction;
			springPos.set(scrollPosRef.current);
			const newCenter = currentIndex();
			setActualCenter(newCenter);
			setCameraPosition(newCenter);
			return newCenter;
		},
		[springPos, currentIndex, setCameraPosition],
	);

	const selectItem = useCallback(
		(index: number) => {
			clearLockIn();
			const delta = circularDelta(currentIndex(), index, itemCount);
			scrollPosRef.current += delta;
			springPos.set(scrollPosRef.current);
			setActualCenter(index);
			setCameraPosition(index);
			commitNavigation(index);
		},
		[
			clearLockIn,
			currentIndex,
			itemCount,
			springPos,
			setCameraPosition,
			commitNavigation,
		],
	);

	return {
		navItems,
		itemCount,
		springPos,
		actualCenter,
		isInteracting,
		beginInteraction,
		advance,
		scheduleLockIn,
		clearLockIn,
		selectItem,
		currentIndex,
	};
}

const WheelNavItem = memo(function WheelNavItem({
	itemIndex,
	itemCount,
	item,
	springPos,
	isActive,
	onSelect,
	axis,
}: {
	itemIndex: number;
	itemCount: number;
	item: NavItem;
	springPos: MotionValue<number>;
	isActive: boolean;
	onSelect: (index: number) => void;
	axis: 'x' | 'y';
}) {
	const config = AXIS_CONFIG[axis];
	const circumference = itemCount * config.slotSize;

	const rawOffset = useTransform(springPos, (sv) => {
		let pos = (itemIndex - sv) * config.slotSize;
		pos =
			((pos % circumference) + circumference + circumference / 2) %
				circumference -
			circumference / 2;
		return pos;
	});

	const position = useTransform(rawOffset, (ro) => ro + config.offset);

	const scale = useTransform(
		rawOffset,
		[
			-3 * config.slotSize,
			-2 * config.slotSize,
			-config.slotSize,
			0,
			config.slotSize,
			2 * config.slotSize,
			3 * config.slotSize,
		],
		[0.4, 0.6, 0.8, 1.0, 0.8, 0.6, 0.4],
	);

	const opacity = useTransform(
		rawOffset,
		[
			-2.5 * config.slotSize,
			-2 * config.slotSize,
			-config.slotSize,
			0,
			config.slotSize,
			2 * config.slotSize,
			2.5 * config.slotSize,
		],
		[0, 0.25, 0.6, 1.0, 0.6, 0.25, 0],
	);

	const iconComponent = getIcon(item.icon);

	return (
		<motion.div
			className={config.slotClass}
			style={{
				...(axis === 'y' ? { y: position } : { x: position }),
				scale,
				opacity,
				position: 'absolute',
				...config.slotStyle,
			}}
		>
			<Link
				href={item.to}
				draggable={false}
				className={`${config.itemClass} ${isActive ? config.activeClass : ''}`}
				onClick={(e) => {
					e.preventDefault();
					onSelect(itemIndex);
				}}
			>
				{iconComponent &&
					createElement(iconComponent, {
						size: isActive ? config.iconSize[0] : config.iconSize[1],
						strokeWidth: 1.5,
						className: 'shrink-0',
					})}
				<ScrambleText
					speed={0.5}
					step={10}
					scramble={3}
					className={`leading-[1em] ${isActive ? config.textClass[0] : config.textClass[1]}`}
				>
					{item.text}
				</ScrambleText>
			</Link>
		</motion.div>
	);
});

function DesktopWheelNav() {
	const {
		navItems,
		itemCount,
		springPos,
		actualCenter,
		isInteracting,
		beginInteraction,
		advance,
		scheduleLockIn,
		selectItem,
		currentIndex,
	} = useWheelNav();

	const scrollAccum = useRef(0);
	const containerRef = useRef<HTMLDivElement>(null);

	const handleWheel = useCallback(
		(e: WheelEvent) => {
			e.preventDefault();
			beginInteraction();
			scrollAccum.current += e.deltaY;
			if (Math.abs(scrollAccum.current) >= SCROLL_THRESHOLD) {
				const direction = scrollAccum.current > 0 ? 1 : -1;
				scrollAccum.current = 0;
				scheduleLockIn(advance(direction));
			} else {
				scheduleLockIn(currentIndex());
			}
		},
		[beginInteraction, advance, scheduleLockIn, currentIndex],
	);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		container.addEventListener('wheel', handleWheel, { passive: false });
		return () => container.removeEventListener('wheel', handleWheel);
	}, [handleWheel]);

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
				variants={DESKTOP_HIGHLIGHT_VARIANTS}
				animate={isInteracting ? 'interacting' : 'idle'}
				transition={HIGHLIGHT_TRANSITION}
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
					onSelect={selectItem}
					axis='y'
				/>
			))}
		</div>
	);
}

function MobileWheelNav() {
	const {
		navItems,
		itemCount,
		springPos,
		actualCenter,
		isInteracting,
		beginInteraction,
		advance,
		scheduleLockIn,
		clearLockIn,
		selectItem,
		currentIndex,
	} = useWheelNav();

	const gesture = useRef<{
		startX: number;
		lastX: number;
		dragging: boolean;
	} | null>(null);
	const wasDragged = useRef(false);

	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		clearLockIn();
		wasDragged.current = false;
		gesture.current = {
			startX: e.clientX,
			lastX: e.clientX,
			dragging: false,
		};
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		const active = gesture.current;
		if (!active) return;
		if (!active.dragging && Math.abs(e.clientX - active.startX) > TAP_SLOP) {
			active.dragging = true;
			e.currentTarget.setPointerCapture(e.pointerId);
			beginInteraction();
		}
		if (!active.dragging) return;
		const deltaX = e.clientX - active.lastX;
		if (Math.abs(deltaX) >= MOBILE_DRAG_THRESHOLD) {
			active.lastX = e.clientX;
			advance(deltaX < 0 ? 1 : -1);
		}
	};

	const handlePointerEnd = () => {
		const dragged = gesture.current?.dragging ?? false;
		wasDragged.current = dragged;
		gesture.current = null;
		if (dragged || isInteracting) scheduleLockIn(currentIndex());
	};

	const handleClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
		if (wasDragged.current) {
			e.stopPropagation();
			e.preventDefault();
		}
		wasDragged.current = false;
	};

	if (itemCount === 0) return null;

	return (
		<div
			className='mobile-wheel-container md:hidden'
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerEnd}
			onPointerCancel={handlePointerEnd}
			onClickCapture={handleClickCapture}
		>
			<motion.div
				className='mobile-wheel-highlight'
				variants={MOBILE_HIGHLIGHT_VARIANTS}
				animate={isInteracting ? 'interacting' : 'idle'}
				transition={HIGHLIGHT_TRANSITION}
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
						<WheelNavItem
							key={`mobile-wheel-${itemIndex}`}
							itemIndex={itemIndex}
							itemCount={itemCount}
							item={item}
							springPos={springPos}
							isActive={itemIndex === actualCenter}
							onSelect={selectItem}
							axis='x'
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
