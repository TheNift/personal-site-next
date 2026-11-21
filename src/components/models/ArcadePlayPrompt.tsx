"use client";
import { Suspense, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { MathUtils } from 'three';
import type { Group } from 'three';
import { useLanguage } from '@contexts/LanguageContext';
import { useUI } from '@/contexts/UIContext';

const HOVER_SCALE = 1.1;
const SCALE_LERP_SPEED = 12;
const ignoreRaycast = () => null;

export function ArcadePlayPrompt() {
	const { strings } = useLanguage();
	const { setGameRunning } = useUI();
	const [isHovered, setIsHovered] = useState(false);
	const textGroupRef = useRef<Group>(null);

	useEffect(() => {
		return () => {
			document.body.style.cursor = 'auto';
		};
	}, []);

	useFrame((_, delta) => {
		const textGroup = textGroupRef.current;
		if (!textGroup) return;
		const targetScale = isHovered ? HOVER_SCALE : 1;
		const nextScale = MathUtils.damp(
			textGroup.scale.x,
			targetScale,
			SCALE_LERP_SPEED,
			delta,
		);
		textGroup.scale.setScalar(nextScale);
	});

	return (
		<group position={[0.35, 1.84, -0.01]} rotation={[0, 0.5 * Math.PI, 0]}>
			<group ref={textGroupRef} position={[0, 0.1, 0]}>
				<Suspense fallback={null}>
					<Text
						font='/fonts/Doto-ExtraBold.ttf'
						fontSize={0.16}
						color='#000000'
						anchorX='center'
						anchorY='middle'
						raycast={ignoreRaycast}
					>
						{strings.game.play.toUpperCase()}
					</Text>
				</Suspense>
			</group>
			<mesh
				onPointerOver={(e) => {
					e.stopPropagation();
					setIsHovered(true);
					document.body.style.cursor = 'pointer';
				}}
				onPointerOut={() => {
					setIsHovered(false);
					document.body.style.cursor = 'auto';
				}}
				onClick={(e) => {
					e.stopPropagation();
					setGameRunning(true);
				}}
			>
				<planeGeometry args={[0.78, 0.78]} />
				<meshBasicMaterial visible={false} />
			</mesh>
		</group>
	);
}
