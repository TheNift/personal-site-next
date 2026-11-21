export const ASSETS = {
  chair: '/models/chair.glb',
  desk: '/models/desk.glb',
  keyboard: '/models/keyboard.glb',
  monitor: '/models/monitor.glb',
  mouse: '/models/mouse.glb',
  phone: '/models/phone.glb',
  plant: '/models/plant.glb',
  shelf: '/models/shelf.glb',
  motorcycle: '/models/sv650.glb',
  maxwell: '/models/maxwell.glb',
  ray: '/models/ray01.glb',
  gundamWing: '/models/gundam_wing.glb',
} as const;

export const OBJ_ASSETS = {
	arcadeMachine: '/models/ArcadeMachine.obj',
} as const;

export type AssetKey = keyof typeof ASSETS;

export type ObjAssetKey = keyof typeof OBJ_ASSETS;

export const getAssetPath = (key: AssetKey): string => ASSETS[key];

export const getObjAssetPath = (key: ObjAssetKey): string => OBJ_ASSETS[key];

export const getAllAssetPaths = (): string[] => Object.values(ASSETS);

export const getAllObjAssetPaths = (): string[] => Object.values(OBJ_ASSETS);
