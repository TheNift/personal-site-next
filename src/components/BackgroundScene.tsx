'use client';
import {
	useRef,
	useEffect,
	useState,
	useMemo,
	useCallback,
	startTransition,
	Suspense,
} from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Vector3, Color } from 'three';
import {
	Motorcycle,
	Desk,
	Monitor,
	Chair,
	Keyboard,
	Mouse,
	Plant,
	Shelf,
	Phone,
	InteractiveRay,
	InteractiveGundamWing,
	ContactForm3D,
} from '@models';
import { SpinningMaxwell } from '@components/SpinningMaxwell';
import type { ModelHandle } from '@types';
import { useBackground } from '@contexts/BackgroundContext';
import { useLanguage } from '@contexts/LanguageContext';
import { bayer8x8Shader } from '@components/shaders';
import { ShaderLayer } from './ShaderLayer';
import { preloadThreeJSAssets } from '@/utils/sceneLoader';
import GalleryView from '@views/GalleryView';

export const preloadAssets = (onProgress: (progress: number) => void) =>
	preloadThreeJSAssets(useGLTF.preload, onProgress);

function LightSource() {
	return (
		<>
			<pointLight
				color='white'
				intensity={100}
				position={[5, 8, 5]}
				castShadow={true}
			/>
			<pointLight
				color='white'
				intensity={20}
				position={[-3.8, 5, 4.2]}
				castShadow={true}
			/>
			<pointLight
				color='white'
				intensity={5}
				position={[-6, 7, 1]}
				castShadow={true}
			/>
			<ambientLight
				color='white'
				intensity={5}
			/>
		</>
	);
}

interface CameraConfig {
	position: Vector3;
	lookAt: Vector3;
	mobilePosition?: Vector3;
	mobileLookAt?: Vector3;
}

const MOBILE_BREAKPOINT = 768;

const INITIAL_CANVAS_CAMERA = {
	position: [0, 8, -5] as [number, number, number],
	fov: 75,
	near: 0.1,
	far: 1000,
};

interface ModelRefs {
	[key: string]: React.RefObject<ModelHandle>;
}

function CameraController({
	cameraConfigs,
	activeIndex,
}: {
	cameraConfigs: CameraConfig[];
	activeIndex: number;
}) {
	const { camera, size } = useThree();
	const isMobile = size.width < MOBILE_BREAKPOINT;

	const targetPosition = useRef(new Vector3());
	const currentPosition = useRef(new Vector3());
	const targetLookAt = useRef(new Vector3());
	const currentLookAt = useRef(new Vector3());
	const isInitialized = useRef(false);
	const prevIsMoving = useRef(false);

	const { setIsCameraMoving } = useBackground();

	useEffect(() => {
		if (cameraConfigs[activeIndex]) {
			const config = cameraConfigs[activeIndex];
			const targetPos =
				isMobile && config.mobilePosition ?
					config.mobilePosition
				:	config.position;
			const targetLook =
				isMobile && config.mobileLookAt ?
					config.mobileLookAt
				:	config.lookAt;

			targetPosition.current.copy(targetPos);
			targetLookAt.current.copy(targetLook);

			if (!isInitialized.current) {
				currentPosition.current.copy(targetPos);
				currentLookAt.current.copy(targetLook);
				camera.position.copy(targetPos);
				camera.lookAt(targetLook);
				isInitialized.current = true;
			} else {
				setIsCameraMoving(true);
			}
		}
	}, [cameraConfigs, activeIndex, camera, isMobile]);

	useFrame(() => {
		const MOVEMENT_THRESHOLD = 0.005;

		currentPosition.current.lerp(targetPosition.current, 0.05);
		currentLookAt.current.lerp(targetLookAt.current, 0.05);

		camera.position.copy(currentPosition.current);
		camera.lookAt(currentLookAt.current);
		if (activeIndex === 4) {
			camera.rotation.z = 0.9 * Math.PI;
		}

		const positionDistance = currentPosition.current.distanceTo(
			targetPosition.current,
		);
		const lookAtDistance = currentLookAt.current.distanceTo(
			targetLookAt.current,
		);

		const isMoving =
			positionDistance > MOVEMENT_THRESHOLD ||
			lookAtDistance > MOVEMENT_THRESHOLD;

		if (isMoving !== prevIsMoving.current) {
			prevIsMoving.current = isMoving;
			setIsCameraMoving(isMoving);
		}

		// Add rotation to the alr tracked camera position and lookat
		// Make it optional, so if no rotation it doesn't do anything, but if it has one it lerps to that rotation
		// Only used on Contact right now
	});

	return null;
}

function SceneReadyDetector({ onReady }: { onReady: () => void }) {
	const { gl } = useThree();

	useEffect(() => {
		onReady();
	}, [gl, onReady]);

	return null;
}

const BackgroundScene = () => {
	const [isSceneReady, setIsSceneReady] = useState(false);
	const [isFullyLoaded, setIsFullyLoaded] = useState(false);
	const [monitorHovered, setMonitorHovered] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => setIsMobile(window.innerWidth < 768);
		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	const { cameraPosition, isAssetsLoading, isCameraMoving } = useBackground();
	const { strings } = useLanguage();
	const router = useRouter();
	const navigate = useCallback(
		(path: string) => startTransition(() => router.push(path)),
		[router],
	);

	useEffect(() => {
		router.prefetch('/about');
		router.prefetch('/experience');
		router.prefetch('/portfolio');
		router.prefetch('/contact');
		router.prefetch('/gallery');
	}, [router]);
	const pathname = usePathname();
	const location = { pathname: pathname || '/' };
	const sceneBackground = useMemo(
		() => new Color(strings.colors.siteBg),
		[strings.colors.siteBg],
	);
	const handleSceneReady = useCallback(() => setIsSceneReady(true), []);

	useEffect(() => {
		if (!isAssetsLoading && isSceneReady) {
			setIsFullyLoaded(true);
		} else {
			setIsFullyLoaded(false);
		}
	}, [isAssetsLoading, isSceneReady]);

	useEffect(() => {
		if (location.pathname === '/gallery') {
			const triggerResize = () => {
				window.dispatchEvent(new Event('resize'));
			};
			const timer1 = setTimeout(triggerResize, 100);
			const timer2 = setTimeout(triggerResize, 700);

			return () => {
				clearTimeout(timer1);
				clearTimeout(timer2);
			};
		}
	}, [location.pathname]);

	const modelRefs: ModelRefs = {
		desk: useRef<ModelHandle>(null!),
		motorcycle: useRef<ModelHandle>(null!),
		computer: useRef<ModelHandle>(null!),
		monitor: useRef<ModelHandle>(null!),
		chair: useRef<ModelHandle>(null!),
		keyboard: useRef<ModelHandle>(null!),
		mouse: useRef<ModelHandle>(null!),
		plant: useRef<ModelHandle>(null!),
		shelf: useRef<ModelHandle>(null!),
		phone: useRef<ModelHandle>(null!),
		cube1: useRef<ModelHandle>(null!),
	};

	const cameraConfigs: CameraConfig[] = useMemo(
		() => [
			// Home - looking at desk area
			{
				position: new Vector3(0, 8, -5),
				lookAt: new Vector3(1, 0, 6),
				mobilePosition: new Vector3(-3, 6, -5),
				mobileLookAt: new Vector3(-3.5, 2, 3.5),
			},
			// About - looking at motorcycle
			{
				position: new Vector3(0, 5, 0.5),
				lookAt:
					modelRefs.motorcycle.current?.location.add(
						new Vector3(0, 4, 0),
					) || new Vector3(0, 0, 0),
				mobilePosition: new Vector3(-5, 5, -1),
				mobileLookAt:
					modelRefs.motorcycle.current?.location.add(
						new Vector3(0, 6, 0),
					) || new Vector3(0, 0, 0),
			},
			// Experience - looking computer setup
			{
				position: new Vector3(0, 5, -1),
				lookAt:
					modelRefs.monitor.current?.location.clone() ||
					new Vector3(0, 0, 0),
			},
			// Portfolio - looking at shelf
			{
				position: new Vector3(-3, 6, 1.5),
				lookAt:
					modelRefs.shelf.current?.location.add(
						new Vector3(0, 1, 0),
					) || new Vector3(0, 0, 0),
				mobilePosition: new Vector3(-3, 6, 2),
				mobileLookAt:
					modelRefs.shelf.current?.location.add(
						new Vector3(0, 1, -0.2),
					) || new Vector3(0, 0, 0),
			},
			// Contact - looking at phone
			{
				position: new Vector3(-1.1, 3.4, 3),
				lookAt:
				modelRefs.phone.current?.location.clone() ||
					new Vector3(0, 0, 0),
			},
			// Gallery - zoomed into monitor
			{
				position: new Vector3(-3.48, 4.7, 2.5),
				lookAt: new Vector3(-3.48, 4.35, 4.2),
				mobilePosition: new Vector3(-3.48, 4.35, 2.5),
				mobileLookAt: new Vector3(-3.48, 4.35, 4.2),
			},
		],
		[isAssetsLoading, isFullyLoaded],
	);

	return (
		<div className='w-full h-full relative overflow-hidden'>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{
					opacity: isFullyLoaded ? 1 : 0,
					scale: isFullyLoaded ? 1 : 0.95,
				}}
				exit={{ opacity: 0, scale: 0.95 }}
				transition={{
					duration: 0.5,
					ease: 'easeInOut',
					delay: isFullyLoaded ? 0.1 : 0,
				}}
				style={{ width: '100%', height: '100%' }}
			>
				<Canvas
					camera={INITIAL_CANVAS_CAMERA}
					style={{
						width: '100%',
						height: '100%',
					}}
					gl={{
						alpha: true,
						antialias: false,
					}}
					scene={{
						background: sceneBackground,
					}}
					onCreated={({ gl }) => {
						gl.domElement.addEventListener(
							'webglcontextlost',
							(event) => {
								event.preventDefault();
							},
							false,
						);
						gl.domElement.addEventListener(
							'webglcontextrestored',
							() => {
								gl.resetState();
							},
							false,
						);
					}}
				>
					<SceneReadyDetector onReady={handleSceneReady} />
					<LightSource />

					{/* About */}
					<Motorcycle
						ref={modelRefs.motorcycle}
						position={[8, 0, 3]}
						rotation={[0, -0.1 * Math.PI, -0.05 * Math.PI]}
						// onFrame={(mesh) => {
						// 	mesh.rotation.y += 0.001;
						// }}
						receiveShadow={true}
						suspense={true}
					/>

					{/* Portfolio */}
					<Desk
						ref={modelRefs.computer}
						position={[-3.5, 0, 3.5]}
						scale={[3, 3, 3]}
						rotation={[0, 0.5 * Math.PI, 0]}
						color='green'
						receiveShadow={true}
						castShadow={true}
						suspense={true}
					/>
					<Monitor
						ref={modelRefs.monitor}
						position={[-3.5, 2.85, 4.2]}
						rotation={[0, 0.5 * Math.PI, 0]}
						scale={[0.04, 0.04, 0.04]}
						color='white'
						receiveShadow={true}
						castShadow={true}
						suspense={true}
					>
						{/* Screen Content and Hitbox */}
						<group position={[6.25, 37.5, 0.5]}>
							{/* 1. Yaw to face outward from the monitor */}
							<group rotation={[0, 0.5 * Math.PI, 0]}>
								{/* 2. Pitch to match the monitor's physical backward tilt */}
								<group rotation={[-0.06 * Math.PI, 0, 0]}>
									
									{/* Hitbox */}
									<mesh
										onPointerOver={(e) => {
											e.stopPropagation();
											if (cameraPosition === 0 && location.pathname === '/') {
												setMonitorHovered(true);
												document.body.style.cursor = 'pointer';
											}
										}}
										onPointerOut={() => {
											setMonitorHovered(false);
											document.body.style.cursor = 'auto';
										}}
										onClick={(e) => {
											e.stopPropagation();
											if (cameraPosition === 0 && location.pathname === '/') {
												navigate('/gallery');
											}
										}}
									>
										<boxGeometry args={[55, 35, 2.5]} />
										<meshBasicMaterial visible={false} />
									</mesh>

									{/* Gallery Tooltip */}
									<group position={[0, 23.75, 0]}>
										<Html>
											<div
												className='pointer-events-none bg-black/80 text-white px-2 py-1 rounded text-sm whitespace-nowrap'
												style={{
													opacity: monitorHovered ? 1 : 0,
													transition: 'opacity 150ms ease',
													transform: 'translateX(-50%)',
												}}
											>
												Gallery
											</div>
										</Html>
									</group>

									{/* Screen Content */}
									<SpinningMaxwell />
									{location.pathname === '/gallery' && !isMobile && (
										<Html
											transform
											position={[0.75, -0.5, 0.01]}
											scale={(90 / 1280) / 0.04}
										>
											<div
												style={{
													opacity: isCameraMoving ? 0 : 1,
													transition: 'opacity 200ms ease',
													pointerEvents: isCameraMoving ? 'none' : 'auto',
												}}
											>
												<div 
													className='bg-site-bg overflow-hidden relative'
													style={{ width: '1280px', height: '720px' }}
												>
													<GalleryView />
												</div>
											</div>
										</Html>
									)}

								</group>
							</group>
						</group>
					</Monitor>
					<Keyboard
						ref={modelRefs.keyboard}
						position={[-2.9, 2.85, 2.9]}
						rotation={[0, -0.57 * Math.PI, 0]}
						scale={[0.006, 0.006, 0.006]}
						color='white'
						receiveShadow={true}
						castShadow={true}
						suspense={true}
					/>
					<Mouse
						ref={modelRefs.mouse}
						position={[-4.5, 3, 2.9]}
						rotation={[0, 1.1 * Math.PI, 0]}
						scale={[0.004, 0.004, 0.004]}
						color='white'
						receiveShadow={true}
						castShadow={true}
						suspense={true}
					/>
					<Chair
						ref={modelRefs.chair}
						position={[-4, 0, 0]}
						rotation={[0, 0.3 * Math.PI, 0]}
						scale={[4, 4, 4]}
						color='white'
						receiveShadow={true}
						castShadow={true}
						suspense={true}
					/>
					<Plant
						ref={modelRefs.plant}
						position={[-1, 3.85, 4]}
						rotation={[0, 0 * Math.PI, 0]}
						scale={[1, 1, 1]}
						color='white'
						receiveShadow={true}
						castShadow={true}
						suspense={true}
					/>
					<Shelf
						ref={modelRefs.shelf}
						position={[-6, 5, 2.5]}
						rotation={[0, 0 * Math.PI, 0]}
						size={[1, 1, 1]}
						scale={[1.2, 1, 1.2]}
						color='white'
						receiveShadow={true}
						castShadow={true}
						suspense={true}
					/>
					<InteractiveRay
						position={[-6, 5.32, 2.9]}
						rotation={[0, 1.5 * Math.PI, 0]}
						scale={[0.75, 0.75, 0.75]}
						label={strings.projects.personalSite.title}
						slug={strings.projects.personalSite.slug}
						onNavigate={navigate}
					/>
					<InteractiveGundamWing
						position={[-6.3, 5.28, 1.6]}
						rotation={[
							0.05 * Math.PI,
							0.5 * Math.PI,
							-0.05 * Math.PI,
						]}
						scale={[0.3, 0.3, 0.3]}
						label={strings.projects.p3Projects.title}
						slug={strings.projects.p3Projects.slug}
						onNavigate={navigate}
					/>
					<Phone
						ref={modelRefs.phone}
						position={[-1.1, 2.85, 3]}
						rotation={[0.5 * Math.PI, 1 * Math.PI, -0.1 * Math.PI]}
						scale={[0.8, 0.8, 0.8]}
						color='white'
						receiveShadow={true}
						castShadow={true}
						suspense={true}
					>
						{location.pathname === '/contact' && <ContactForm3D />}
					</Phone>
					<CameraController
						cameraConfigs={cameraConfigs}
						activeIndex={cameraPosition}
					/>
					<ShaderLayer shader={bayer8x8Shader} />
				</Canvas>
			</motion.div>
		</div>
	);
};

export default BackgroundScene;
