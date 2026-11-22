/** 2D affine matrix [a, b, c, d, e, f]: x' = a·x + c·y + e, y' = b·x + d·y + f (PDF convention). */
export type Matrix = [number, number, number, number, number, number];

/** Returns m1 ∘ m2 (apply m2 first, then m1). */
export function compose(m1: Matrix, m2: Matrix): Matrix {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

export function invert([a, b, c, d, e, f]: Matrix): Matrix {
  const det = a * d - b * c;
  if (!det) throw new Error("Matrix is not invertible");
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det];
}

export function apply([a, b, c, d, e, f]: Matrix, x: number, y: number): [number, number] {
  return [a * x + c * y + e, b * x + d * y + f];
}

/**
 * Builds the matrix that maps "drawing space" to PDF user space for one page.
 *
 * Drawing space = the page as the user sees it (after /Rotate and the crop box are applied),
 * measured in points with the origin at the bottom-left and y pointing up — the same convention
 * pdf-lib's draw* functions expect on an unrotated page.
 *
 * `viewportTransform` is pdf.js `page.getViewport({ scale: 1 }).transform` (PDF → screen, y down)
 * and `viewHeight` is that viewport's height.
 */
export function drawingToPdf(viewportTransform: Matrix, viewHeight: number): Matrix {
  const flipY: Matrix = [1, 0, 0, -1, 0, viewHeight];
  return compose(invert(viewportTransform), flipY);
}
