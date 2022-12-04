<script setup lang='ts'>

import * as THREE from 'three';
import { AmbientLight, Camera, DirectionalLight, EffectComposer, GltfModel, Renderer, RendererPublicInterface, Scene } from 'troisjs';
import { glbToThree } from 'zebrapig-three-utils';
import GifLoader from '../../workarounds/three-gif-loader/gif-loader.js';
import { Carousel } from './Carousel';

const props = defineProps<{
    activeService: number;
    marginLeft: number;
    fov: number;
    numberOfServices: number,
}>();

const activeService = toRef(props, 'activeService');

const { public: { CONTENT_ENDPOINT } } = useRuntimeConfig();

const renderer = ref<RendererPublicInterface>();
const camera = ref<{ camera: THREE.Camera }>();
const cursorTarget = ref(new THREE.Vector2());
const cursor = ref(new THREE.Vector2());
const hidden = ref(true);
const canvasWrapper = ref<HTMLDivElement>();

const carousel = ref(new Carousel({
    inertia: 0.15,
    drag: 5,
    radius: 15,
    arms: props.numberOfServices,
    offset: new THREE.Vector3(0, 15, 0),
}));

enum Models
{
    Camera = 'Camera',
    Computer = 'Computer',
    PlanetModel = 'PlanetModel',
}

const models = ref<{
    [ P in Models ]?: {
        model: THREE.Object3D,
        mixer?: THREE.AnimationMixer,
    }
}>({});

function captureCursor(e: MouseEvent)
{
    cursorTarget.value.set(
        2 * (e.pageX / window.innerWidth) - 1,
        2 * (e.pageY / window.innerWidth) - 1,
    );
}

onMounted(() =>
{
    document.addEventListener('mousemove', captureCursor);
    const clock = new THREE.Clock();

    const troisRenderer = renderer.value;
    if (!troisRenderer) return;

    troisRenderer.onBeforeRender(() =>
    {
        const dt = clock.getDelta();

        /**
         * RESIZE
         */
        const size = canvasWrapper.value.getBoundingClientRect();
        const width = Math.floor(size.width);
        const height = Math.floor(size.height);
        troisRenderer.renderer.setPixelRatio(window.devicePixelRatio);
        troisRenderer.renderer.setSize(width, height);

        // const cam = camera.value.camera as THREE.PerspectiveCamera;
        // cam.aspect = width / height;
        // cam.updateProjectionMatrix();

        carousel.value.update(dt);
        const arms = carousel.value.getArms();

        models.value[ Models.Camera ]?.model.position.copy(arms[ 0 ]);
        models.value[ Models.PlanetModel ]?.model.position.copy(arms[ 1 ]);
        models.value[ Models.Computer ]?.model.position.copy(arms[ 2 ]);
        Object.values(models.value).forEach(({ mixer }) => mixer?.update(dt));

        if (Object.values(models.value).every(entry => entry != null))
            hidden.value = false;

        cursor.value.lerp(cursorTarget.value, Math.min(1, 3 * dt));

        const cam = camera.value.camera as THREE.PerspectiveCamera;
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));

        cam.position
            .set(12, -6, 4)
            .add(right.multiplyScalar( -2 * cursor.value.x ))
            .add(up.multiplyScalar(     1 * cursor.value.y ))

        cam.up.set(0, 0, 1);
        cam.lookAt(0, 0, 0);

        cam.setViewOffset(
            width * (1 + props.marginLeft), height, 
            0, 0, 
            width, height, 
        );
    })

});

onUnmounted(() =>
{
    document.removeEventListener('mousemove', captureCursor);
});

watch(activeService, newService =>
{
    if (carousel.value)
        carousel.value.targetAngle = 2 * Math.PI * newService / props.numberOfServices;
});

const url = (path: TemplateStringsArray) => CONTENT_ENDPOINT + path[ 0 ];
const txtLoader = new THREE.TextureLoader();

const oldColorMap = txtLoader.load(url`/32f10b23-4298-4f55-a5a7-f9cf57211f45.png`);
const newColorMap = txtLoader.load(url`/c9b235a7-da9b-443c-b5b8-f049bdf422bd.png`);
newColorMap.magFilter = oldColorMap.magFilter = THREE.NearestFilter;
newColorMap.flipY = oldColorMap.flipY = false;

const onCamera = (gltf: any) =>
{
    const { root } = glbToThree(gltf, [
        {
            glob: '/camera/**/*',
            material: new THREE.MeshToonMaterial({
                map: oldColorMap,
                side: THREE.DoubleSide,
            }),
        },
        {
            glob: '/shapes',
            material: new THREE.MeshBasicMaterial({
                color: 0xFFA74D,
                side: THREE.DoubleSide,
            }),
        },
    ]);

    const mixer = new THREE.AnimationMixer(root);

    gltf.animations.forEach((a: THREE.AnimationClip) =>
        mixer.clipAction(a).play()
    );

    models.value[ Models.Camera ] =
    {
        model: root,
        mixer,
    };
}

const onComputer = (gltf: any) =>
{
    const gifPath = url`/edb0840c-8505-4b3c-a119-dc2d5dc63d4f.gif`;

    const gif = new GifLoader().load(gifPath, () => {});
    gif.flipY = false;

    const { root } = glbToThree(gltf, [
        {
            glob: '/computer/**/*',
            material: new THREE.MeshToonMaterial({
                map: oldColorMap,
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

    models.value[ Models.Computer ] =
    {
        model: root,
    };
}

function onGlobe(gltf: any)
{
    const { root } = glbToThree(gltf, [
        {
            glob: '/**/*',
            material: new THREE.MeshToonMaterial({
                color: 0xc3bdff,
                map: newColorMap,
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
                color: 0x1d915f,
                side: THREE.FrontSide,
            })
        },
    ]);

    const mixer = new THREE.AnimationMixer(root);

    gltf.animations.forEach((a: THREE.AnimationClip) =>
        mixer.clipAction(a).play()
    );

    models.value[ Models.PlanetModel ] =
    {
        model: root,
        mixer,
    };
}

</script>

<template>
    <div class="canvas-backdrop" :class="{ hidden }" ref="canvasWrapper">
        <Renderer 
            ref="renderer" 
            :antialias="true" 
            :auto-clear="true" 
            :alpha="true" 
            :resize="true"
        >
            <Camera 
                ref="camera" 
                :look-at="new THREE.Vector3()" 
                :fov="props.fov" 
            />
            <Scene>
                <DirectionalLight 
                    :color="'#eddd93'" 
                    :intensity="1.0" 
                    :position="new THREE.Vector3(8, -10, 12)"
                    :look-at="new THREE.Vector3()" 
                />
                <AmbientLight :color="'#abd7f5'" :intensity=".4" />
                <!-- CAMERA -->
                <GltfModel 
                    :src="url`/05451335-f84f-41fd-a516-725a72051c61.glb`" @load="onCamera" 
                />
                <!-- COMPUTER -->
                <GltfModel 
                    :src="url`/89007a80-55e6-4ea3-a12e-1aa644adddf1.glb`" @load="onComputer" 
                />
                <!-- GLOBE -->
                <GltfModel 
                    :src="url`/eaa57964-332a-4f79-8331-8a7e8a592b52.glb`" @load="onGlobe" 
                />
            </Scene>
        </Renderer>
    </div>
</template>

<style scoped lang='scss'>

.canvas-backdrop
{
    position: relative;

    width: 100%;
    height: 100%;

    overflow: none;


    transition: clip-path 2.5s;
    
    clip-path: circle(100%);

    &.hidden
    {
        clip-path: circle(0%);
        /* opactiy: 0; */
    }
}

</style>