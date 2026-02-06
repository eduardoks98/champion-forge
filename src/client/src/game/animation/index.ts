// ==========================================
// ANIMATION MODULE - Exports
// ==========================================

// Procedural animation (skeleton-based)
export { Bone, type BoneConstraints } from './Bone';
export { Skeleton, SkeletonFactory, type SkeletonConfig, type FacingDirection } from './Skeleton';
export { ProceduralAnimator, type AnimationState, type AnimationConfig } from './ProceduralAnimator';
export { SkeletonRenderer, RendererFactory, type RenderStyle, type PartStyle } from './SkeletonRenderer';

// Sprite sheet animation
export { SpriteAnimator, SpriteAnimatorFactory, type AnimationConfig as SpriteAnimationConfig } from './SpriteAnimator';

// Sprite part rendering (separated body parts)
export {
  SpritePartRenderer,
  SpritePartRendererFactory,
  DEFAULT_CHARACTER_CONFIG,
  type PartConfig,
  type BoneToPartMapping,
  type CharacterConfig
} from './SpritePartRenderer';
