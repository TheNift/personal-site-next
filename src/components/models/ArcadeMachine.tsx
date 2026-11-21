"use client";
import { forwardRef } from 'react';
import { BaseModel } from './BaseModel';
import type { CubeProps, ModelHandle } from '@types';
import { getObjAssetPath } from '@utils/assetRegistry';

const ARCADE_MATERIAL_COLORS: Record<string, string> = {
	Black: '#111111',
	Blue: '#2b5cff',
	DarkGray: '#444444',
	DarkerGray: '#2a2a2a',
	Red: '#d62828',
	White: '#eeeeee',
	VideoGame: '#3fa9f5',
};

const ARCADE_EMISSIVE_MATERIALS = ['VideoGame'];

export const ArcadeMachine = forwardRef<ModelHandle, CubeProps>(
	(
		{
			color: _color = 'white',
			size: _size = [1, 1, 1],
			receiveShadow: _receiveShadow = false,
			castShadow: _castShadow = false,
			onFrame,
			...baseProps
		},
		ref
	) => {
		return (
			<BaseModel
				ref={ref}
				onFrame={onFrame}
				{...baseProps}
				objPath={getObjAssetPath('arcadeMachine')}
				materialColors={ARCADE_MATERIAL_COLORS}
				emissiveMaterials={ARCADE_EMISSIVE_MATERIALS}
			/>
		);
	}
);

ArcadeMachine.displayName = 'ArcadeMachine';
