'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useBackground } from '@contexts/BackgroundContext';

interface HomeHotspotHandlers {
	onPointerOver: (event: ThreeEvent<PointerEvent>) => void;
	onPointerOut: (event: ThreeEvent<PointerEvent>) => void;
	onClick: (event: ThreeEvent<MouseEvent>) => void;
}

export function useHomeHotspot(
	to: string,
	navigate: (path: string) => void,
): { isHovered: boolean; handlers: HomeHotspotHandlers } {
	const { cameraPosition } = useBackground();
	const pathname = usePathname() || '/';
	const [isHovered, setIsHovered] = useState(false);
	const canInteract = cameraPosition === 0 && pathname === '/';

	const handlers: HomeHotspotHandlers = {
		onPointerOver: (event) => {
			if (!canInteract) return;
			event.stopPropagation();
			setIsHovered(true);
			document.body.style.cursor = 'pointer';
		},
		onPointerOut: () => {
			if (!isHovered) return;
			setIsHovered(false);
			document.body.style.cursor = 'auto';
		},
		onClick: (event) => {
			if (!canInteract) return;
			event.stopPropagation();
			document.body.style.cursor = 'auto';
			setIsHovered(false);
			navigate(to);
		},
	};

	return { isHovered: isHovered && canInteract, handlers };
}

export function HomeHotspotTooltip({
	label,
	isVisible,
	position,
}: {
	label: string;
	isVisible: boolean;
	position?: [number, number, number];
}) {
	return (
		<group position={position}>
			<Html>
				<div
					className='pointer-events-none bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap'
					style={{
						opacity: isVisible ? 1 : 0,
						transition: 'opacity 150ms ease',
						transform: 'translateX(-50%)',
					}}
				>
					{label}
				</div>
			</Html>
		</group>
	);
}
