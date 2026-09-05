import { type ReactNode } from 'react';
import { type Euler, type Group, type Mesh, type Vector3 } from 'three';
import { type ThreeEvent } from '@react-three/fiber';

export interface Project {
	title: string;
	slug: string;
	key: string;
}

export type AnimatableObject = {
	position: Vector3;
	rotation: Euler;
	scale: Vector3;
	visible: boolean;
};

export interface ModelHandle {
	location: Vector3;
	mesh: Mesh | Group | null;
	gltf?: unknown;
}

export interface BaseModelProps {
	position?: [number, number, number];
	rotation?: [number, number, number];
	scale?: [number, number, number];
	children?: ReactNode;
	onFrame?: (mesh: AnimatableObject, delta: number) => void;
	gltfPath?: string;
	suspense?: boolean;
	fallback?: ReactNode;
	onClick?: (event: ThreeEvent<MouseEvent>) => void;
	onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
	onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
	onPointerMove?: (event: ThreeEvent<PointerEvent>) => void;
	receiveShadow?: boolean;
	castShadow?: boolean;
}

export interface CubeProps extends BaseModelProps {
	color?: string;
	size?: [number, number, number];
}

export interface GLTFModelProps extends Omit<BaseModelProps, 'gltfPath'> {
	gltfPath: string;
	animations?: string[];
}
