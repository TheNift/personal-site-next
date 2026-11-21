"use client";
import {
	useRef,
	useImperativeHandle,
	forwardRef,
	useMemo,
	Suspense,
} from 'react';
import type { Ref } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
	Mesh,
	Group,
	Vector3,
	Color,
	MeshStandardMaterial,
} from 'three';
import type { Material, Object3D } from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
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

function cloneSceneWithMaterials(
	scene: Object3D,
	castShadow: boolean | undefined,
	receiveShadow: boolean | undefined,
	transformMaterial?: (material: Material) => Material,
) {
	const cloned = scene.clone(true);
	cloned.traverse((child) => {
		if (child instanceof Mesh) {
			if (castShadow !== undefined) child.castShadow = castShadow;
			if (receiveShadow !== undefined)
				child.receiveShadow = receiveShadow;

			if (child.material) {
				if (Array.isArray(child.material)) {
					child.material = child.material.map((mat) =>
						transformMaterial ? transformMaterial(mat) : mat.clone()
					);
				} else {
					child.material =
						transformMaterial ?
							transformMaterial(child.material)
						:	child.material.clone();
				}
			}
		}
	});
	return cloned;
}

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
				return cloneSceneWithMaterials(
					gltf.scene,
					castShadow,
					receiveShadow,
				);
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

function ObjModel({
	position = [0, 0, 0],
	rotation = [0, 0, 0],
	scale,
	children,
	onFrame,
	objPath,
	materialColors,
	emissiveMaterials,
	suspense = true,
	fallback = null,
	onClick,
	onPointerOver,
	onPointerOut,
	onPointerMove,
	castShadow,
	receiveShadow,
	forwardedRef,
}: VariantProps & { objPath: string }) {
	const meshRef = useModelHandle(forwardedRef, position, onFrame);
	const obj = useLoader(OBJLoader, objPath);

	const clonedScene = useMemo(() => {
		if (obj) {
			try {
				return cloneSceneWithMaterials(
					obj,
					castShadow,
					receiveShadow,
					(material) => {
						const originalColor = (
							material as { color?: Color }
						).color;
						const color =
							materialColors?.[material.name] ?
								new Color(materialColors[material.name])
							:	(originalColor?.clone() ?? new Color('#ffffff'));
						const standard = new MeshStandardMaterial({ color });
						if (emissiveMaterials?.includes(material.name)) {
							standard.emissive.copy(color);
							standard.emissiveIntensity = 0.6;
						}
						return standard;
					},
				);
			} catch (error) {
				console.error('Failed to clone scene:', error);
				return null;
			}
		}
		return null;
	}, [obj, castShadow, receiveShadow, materialColors, emissiveMaterials]);

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
		if (props.objPath) {
			return (
				<ObjModel {...props} objPath={props.objPath} forwardedRef={ref} />
			);
		}
		return <PrimitiveModel {...props} forwardedRef={ref} />;
	}
);

BaseModel.displayName = 'BaseModel';
