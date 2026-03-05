import strings from '@data/strings';
import { Color, Texture, Vector2, Vector3 } from 'three';
import fragmentShader from './bayer8x8/bayer8x8.frag?raw';
import vertexShader from './bayer8x8/bayer8x8.vert?raw';

export interface Bayer8x8ShaderUniforms {
	tDiffuse: { value: Texture | null };
	intensity: { value: number };
	colorA: { value: Vector3 };
	colorB: { value: Vector3 };
	maskColor: { value: Vector3 };
	resolution: { value: Vector2 };
}

export const createBayer8x8ShaderUniforms = () => ({
	tDiffuse: { value: null },
	intensity: { value: 1.0 },
	colorA: { value: new Color(strings.colors.yorha) },
	colorB: { value: new Color(strings.colors.yorhaDark) },
	maskColor: { value: new Color(strings.colors.siteBg) },
	resolution: {
		value: new Vector2(
			typeof window !== 'undefined' ? window.innerWidth : 1920,
			typeof window !== 'undefined' ? window.innerHeight : 1080
		),
	},
});

export { fragmentShader as bayer8x8FragmentShader, vertexShader as bayer8x8VertexShader };

export const bayer8x8Shader = {
	uniforms: createBayer8x8ShaderUniforms(),
	vertexShader,
	fragmentShader,
};
