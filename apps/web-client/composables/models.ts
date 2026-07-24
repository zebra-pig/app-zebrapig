import * as THREE from 'three';
import GifLoader from '../workarounds/three-gif-loader/gif-loader';
import { glbToThree } from 'zebrapig-three-utils';

const txtLoader = new THREE.TextureLoader();
function useOldColorMap() {
    const oldColorMap = txtLoader.load(useAsset(`/32f10b23-4298-4f55-a5a7-f9cf57211f45.png`));
    oldColorMap.magFilter = THREE.NearestFilter;
    oldColorMap.flipY = false;
    return oldColorMap;
}
function useNewColorMap() {
    const newColorMap = txtLoader.load(useAsset(`/c9b235a7-da9b-443c-b5b8-f049bdf422bd.png`));
    newColorMap.magFilter = THREE.NearestFilter;
    newColorMap.flipY = false;
    return newColorMap;
}

export function initComputer(gltf: any) {
    const gifPath = useAsset('/edb0840c-8505-4b3c-a119-dc2d5dc63d4f.gif');
    const gif = new GifLoader().load(gifPath, () => {});
    gif.flipY = false;
    const { root } = glbToThree(gltf, [
        {
            glob: '/computer/**/*',
            material: new THREE.MeshToonMaterial({
                map: useOldColorMap(),
                side: THREE.DoubleSide,
            }),
            eject: 'foreground',
        },
        {
            glob: '/circles/**/*',
            material: new THREE.MeshBasicMaterial({
                color: 0xFF564F,
                side: THREE.DoubleSide,
            })
        },
        {
            glob: '/screen/*',
            material: new THREE.MeshBasicMaterial({
                map: gif as THREE.Texture,
            })
        },
    ]);
    return { model: root };
}

export function initCamera(gltf: any) {
    const { root } = glbToThree(gltf, [
        {
            glob: '/camera/**/*',
            material: new THREE.MeshToonMaterial({
                map: useOldColorMap(),
                side: THREE.DoubleSide,
            }),
        },
        {
            glob: '/shapes',
            material: new THREE.MeshBasicMaterial({
                color: 0x543aa6,
                side: THREE.DoubleSide,
            }),
        },
    ]);

    const mixer = new THREE.AnimationMixer(root);

    gltf.animations.forEach((a: THREE.AnimationClip) => {
        mixer.clipAction(a).play()
    });

    return { model: root, mixer };
}

export function initGlobe(gltf: any) {
    const { root } = glbToThree(gltf, [
        {
            glob: '/**/*',
            material: new THREE.MeshToonMaterial({
                color: 0xc3bdff,
                map: useNewColorMap(),
                side: THREE.FrontSide,
            }),
        },
        {
            glob: '/**/*_out',
            material: new THREE.MeshBasicMaterial({
                color: 0,
                side: THREE.FrontSide,
            }),
        },
        {
            glob: '/shapes',
            material: new THREE.MeshBasicMaterial({
                color: 0x0da382,
                side: THREE.FrontSide,
            })
        },
    ]);

    const mixer = new THREE.AnimationMixer(root);

    gltf.animations.forEach((a: THREE.AnimationClip) =>
        mixer.clipAction(a).play()
    );

    return { model: root, mixer };
}