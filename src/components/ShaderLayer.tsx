'use client';
import { WebGLRenderTarget, NearestFilter } from 'three';
import type { IUniform } from 'three';
import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export interface ShaderLayerProps {
	shader: {
		uniforms: Record<string, IUniform>;
		vertexShader: string;
		fragmentShader: string;
	};
	onUpdate?: (uniforms: Record<string, IUniform>) => void;
}

export const ShaderLayer: React.FC<ShaderLayerProps> = ({
	shader,
	onUpdate,
}) => {
	const { gl, scene, camera, size } = useThree();
	const composerRef = useRef<EffectComposer | null>(null);
	const shaderPassRef = useRef<ShaderPass | null>(null);

	useEffect(() => {
		const target = new WebGLRenderTarget(320, 240);
		target.texture.magFilter = NearestFilter;
		const composer = new EffectComposer(gl, target);
		composerRef.current = composer;

		const renderPass = new RenderPass(scene, camera);
		composer.addPass(renderPass);

		const shaderPass = new ShaderPass(shader);
		shaderPassRef.current = shaderPass;
		shaderPass.renderToScreen = true;
		composer.addPass(shaderPass);

		if (shaderPass.uniforms.resolution) {
			shaderPass.uniforms.resolution.value.set(size.width, size.height);
		}

		return () => {
			composer.dispose();
		};
	}, [gl, scene, camera, shader]);

	useEffect(() => {
		if (composerRef.current && shaderPassRef.current) {
			composerRef.current.setSize(size.width, size.height);
			if (shaderPassRef.current.uniforms.resolution) {
				shaderPassRef.current.uniforms.resolution.value.set(
					size.width,
					size.height,
				);
			}
		}
	}, [size]);

	useFrame(() => {
		if (composerRef.current) {
			if (onUpdate && shaderPassRef.current) {
				onUpdate(shaderPassRef.current.uniforms);
			}
			composerRef.current.render();
		}
	}, 1);

	return null;
};
