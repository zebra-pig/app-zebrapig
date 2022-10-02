

export function clamp(t: number, min = 0, max = 1)
{
    return Math.max(Math.min(t, max), min);
}

export function lerp(t: number, min: number, max: number)
{
    return min + t * (max - min);
}

export function unlerp(x: number, min: number, max: number)
{
    return (x - min) / (max - min);
}

export function map(x: number, a: number, b: number, c: number, d: number)
{
    return lerp(unlerp(x, a, b), c, d);
}