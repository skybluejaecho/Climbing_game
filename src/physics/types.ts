export interface Vec2 { x: number; y: number }
export interface Particle extends Vec2 { previous: Vec2; radius: number; inverseMass: number }
export interface Link { a: number; b: number; length: number; stiffness: number }
export type RouteColor = 'pink' | 'blue' | 'green';
export type HoldProfile = 'SAFE' | 'STANDARD' | 'RISK' | 'RECOVERY';
export interface Hold extends Vec2 { id: number; radius: number; color: RouteColor; profile?: HoldProfile; row?: number }
export interface ActiveGrip { limb: number; hold: number }
export type GripGrade = 'PERFECT' | 'GOOD' | 'BARELY';
export interface LaunchTarget { limb: number; hold: number; launchedAt: number; missed: boolean }
export type FeedbackKind = 'grip' | 'protected' | 'wrong-route' | 'occupied';
export interface GripFeedback { kind: FeedbackKind; grade?: GripGrade; limb?: number; hold: number; time: number }
export interface World {
  particles: Particle[]; links: Link[]; holds: Hold[]; grips: ActiveGrip[];
  launchTargets: LaunchTarget[]; feedback: GripFeedback | null;
  gripProtectedUntil: Record<number, number>;
  activeRoute: RouteColor; nextRoute: RouteColor; time: number;
  focus: number; progressCameraY: number; progressTargetY:number; renderCameraY:number;
  height: number; highestChunk: number; pruneCutoffY:number|null; floorSupports:number[];
  runId: number;
}
