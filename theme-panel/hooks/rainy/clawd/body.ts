// Clawd's body and face, the plain mascot as clawdhouse draws him
// (https://github.com/ishuagrawal/clawdhouse), cut down to what the backdrop
// uses: his body, arms and legs, two square eyes, and a smile with a blush.

// His own pixels: 24 wide and 16 tall.
export const W0 = 24
export const H0 = 16

export const BODY = '#DA7758'
export const BODY_DARK = '#B9603F'
const EYE = '#1A1918'
const BLUSH = '#F4A39A'

export type Face = { eyes: 'open' | 'closed'; mouth: 'none' | 'smile'; blush: boolean; look: { dx: number; dy: number } }

export const face = (eyes: Face['eyes'], mouth: Face['mouth'] = 'none', more: Partial<Face> = {}): Face => ({
  eyes,
  mouth,
  blush: false,
  look: { dx: 0, dy: 0 },
  ...more,
})

export type ArmPose = 'out' | 'down'
export type Arms = { front: ArmPose; back: ArmPose }

// Arm blocks (2 x 2 pixels each) for his left arm; the right mirrors them.
export const ARM_BLOCKS: Record<ArmPose, [number, number][]> = {
  out: [
    [0, 2],
    [1, 2],
    [0, 3],
    [1, 3],
  ],
  down: [
    [0, 4],
    [1, 4],
    [0, 5],
    [1, 5],
  ],
}

// The blocks his four legs start at.
export const LEGS = [2, 4, 7, 9]

type Px = [number, number]

export function drawFace(f: Face, fine: (x: number, y: number, c: string) => void) {
  const { dx, dy } = f.look
  // Drawn for his left side and mirrored across his middle (x ↔ 23 - x).
  const both = (pts: Px[], sx = 0, sy = 0, c = EYE) => {
    for (const [x, y] of pts) {
      fine(x + sx, y + sy, c)
      fine(W0 - 1 - x + sx, y + sy, c)
    }
  }

  if (f.blush) both([[4, 5], [5, 5]], 0, 0, BLUSH)
  if (f.eyes === 'open') both([[6, 2], [7, 2], [6, 3], [7, 3]], dx, dy)
  else both([[5, 3], [6, 3], [7, 3]])
  if (f.mouth === 'smile') for (const [x, y] of [[11, 6], [12, 6]] as Px[]) fine(x, y, EYE)
}
