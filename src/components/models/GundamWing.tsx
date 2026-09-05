"use client";
import { forwardRef } from 'react';
import { BaseModel } from './BaseModel';
import type { CubeProps, ModelHandle } from '@types';
import { getAssetPath } from '@utils/assetRegistry';

export const GundamWing = forwardRef<ModelHandle, CubeProps>(
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
				gltfPath={getAssetPath('gundamWing')}
			/>
		);
	}
);

GundamWing.displayName = 'GundamWing';

