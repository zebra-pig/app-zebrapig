import * as THREE from 'three';

function mod(a: number, n: number)
{
    return (a % n + n) % n;
}

// https://stackoverflow.com/questions/1878907/how-can-i-find-the-difference-between-two-angles
function angleDif(a: number, b: number)
{
    const PI = Math.PI;
    
    return mod(b - a + PI, 2 * PI) - PI;
}

interface CarouselOptions
{
    inertia: number;
    drag: number;
    radius: number;
    arms: number;
    offset: THREE.Vector3,
}

export class Carousel
{
    public arms: THREE.Vector3[];

    constructor(
        private options: CarouselOptions,
        public targetAngle = 0,
        private angle = 0,
        private angularVelocity = 0,
    ) 
    {
        this.arms = new Array(this.options.arms)
            .fill(undefined)
            .map(() => new THREE.Vector3());
    }

    update(dt: number,)
    {
        const _dt = Math.min(dt, 1);

        const phi = angleDif(this.angle, this.targetAngle);

        const { inertia, drag } = this.options;

        const angularAcceleration = phi / inertia;

        this.angularVelocity += angularAcceleration * _dt;
        this.angularVelocity *= 1 - drag;
        this.angle += this.angularVelocity * _dt;
    }

    getArms()
    {
        for (let i = 0; i < this.arms.length; i++)
        {
            const angle = this.angle + 2 * Math.PI * i / this.arms.length;

            this.arms[ i ].set(
                0,
                -this.options.radius * Math.cos(angle),
                this.options.radius * Math.sin(angle),
            ).add(this.options.offset);
        }

        return this.arms;
    }
}