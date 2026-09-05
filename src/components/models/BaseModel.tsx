"use client";
import {
	useRef,
	useImperativeHandle,
	forwardRef,
	useMemo,
	Suspense,
} from 'react';
import type { Ref } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Mesh, Group, Vector3 } from 'three';
import type { BaseModelProps, ModelHandle } from '@types';

// Shared imperative handle + per-frame callback wiring for both model variants.
function useModelHandle(
	ref: Ref<ModelHandle>,
	position: [number, number, number],
	onFrame?: BaseModelProps['onFrame'],
) {
	const meshRef = useRef<Mesh | Group>(null!);

	useImperativeHandle(ref, () => ({
		get location() {
			return meshRef.current ?
					meshRef.current.position.clone()
				:	new Vector3(...position);
		},
		get mesh() {
			return meshRef.current;
		},
	}));

	useFrame((_, delta) => {
		if (meshRef.current && onFrame) {
			onFrame(meshRef.current, delta);
		}
	});

	return meshRef;
}

type VariantProps = BaseModelProps & { forwardedRef: Ref<ModelHandle> };

function GltfModel({
	position = [0, 0, 0],
	rotation = [0, 0, 0],
	scale,
	children,
	onFrame,
	gltfPath,
	suspense = true,
	fallback = null,
	onClick,
	onPointerOver,
	onPointerOut,
	onPointerMove,
	castShadow,
	receiveShadow,
	forwardedRef,
}: VariantProps & { gltfPath: string }) {
	const meshRef = useModelHandle(forwardedRef, position, onFrame);
	const gltf = useGLTF(gltfPath);

	const clonedScene = useMemo(() => {
		if (gltf?.scene) {
			try {
				const cloned = gltf.scene.clone(true);
				cloned.traverse((child) => {
					if (child instanceof Mesh) {
						if (castShadow !== undefined) child.castShadow = castShadow;
						if (receiveShadow !== undefined)
							child.receiveShadow = receiveShadow;

						if (child.material) {
							if (Array.isArray(child.material)) {
								child.material = child.material.map((mat) =>
									mat.clone()
								);
							} else {
								child.material = child.material.clone();
							}
						}
					}
				});
				return cloned;
			} catch (error) {
				console.error('Failed to clone scene:', error);
				return null;
			}
		}
		return null;
	}, [gltf, castShadow, receiveShadow]);

	const content = (
		<group
			ref={meshRef}
			position={position}
			rotation={rotation}
			scale={scale}
			onClick={onClick}
			onPointerOver={onPointerOver}
			onPointerOut={onPointerOut}
			onPointerMove={onPointerMove}
		>
			{clonedScene && <primitive object={clonedScene} />}
			{children}
		</group>
	);

	if (suspense) {
		return <Suspense fallback={fallback || <group />}>{content}</Suspense>;
	}

	return content;
}

function PrimitiveModel({
	position = [0, 0, 0],
	rotation = [0, 0, 0],
	scale,
	children,
	onFrame,
	onClick,
	onPointerOver,
	onPointerOut,
	onPointerMove,
	castShadow,
	receiveShadow,
	forwardedRef,
}: VariantProps) {
	const meshRef = useModelHandle(forwardedRef, position, onFrame);

	return (
		<mesh
			ref={meshRef}
			position={position}
			rotation={rotation}
			scale={scale}
			onClick={onClick}
			onPointerOver={onPointerOver}
			onPointerOut={onPointerOut}
			onPointerMove={onPointerMove}
			castShadow={castShadow}
			receiveShadow={receiveShadow}
		>
			{children}
		</mesh>
	);
}

// Picks a variant by `gltfPath` presence. The branch is stable for a given
// instance, so each variant can call its hooks unconditionally.
export const BaseModel = forwardRef<ModelHandle, BaseModelProps>(
	(props, ref) => {
		if (props.gltfPath) {
			return (
				<GltfModel {...props} gltfPath={props.gltfPath} forwardedRef={ref} />
			);
		}
		return <PrimitiveModel {...props} forwardedRef={ref} />;
	}
);

BaseModel.displayName = 'BaseModel';
