// Collision.ts

/**
 * Простая проверка пересечения двух прямоугольников (AABB)
 * @param x1 - x координата левого верхнего угла первого объекта
 * @param y1 - y координата левого верхнего угла первого объекта
 * @param w1 - ширина первого объекта
 * @param h1 - высота первого объекта
 * @param x2 - x координата левого верхнего угла второго объекта
 * @param y2 - y координата левого верхнего угла второго объекта
 * @param w2 - ширина второго объекта
 * @param h2 - высота второго объекта
 * @returns true, если прямоугольники пересекаются
 */
export function checkCollision(
  x1: number, y1: number, w1: number, h1: number,
  x2: number, y2: number, w2: number, h2: number
): boolean {
  return !(
    x1 + w1 < x2 ||      // первый слева от второго
    x2 + w2 < x1 ||      // второй слева от первого
    y1 + h1 < y2 ||      // первый выше второго
    y2 + h2 < y1         // второй выше первого
  );
}

/**
 * Версия для объектов с полями x, y, width, height
 */
export function objectsCollide(a: any, b: any): boolean {
  return checkCollision(
    a.x, a.y, a.width, a.height,
    b.x, b.y, b.width, b.height
  );
}