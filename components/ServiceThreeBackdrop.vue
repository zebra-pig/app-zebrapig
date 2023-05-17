<script setup lang='ts'>
import * as THREE from 'three';
import { AmbientLight, Camera, DirectionalLight, GltfModel, Renderer, RendererPublicInterface, Scene } from 'troisjs';

type ModelNames = 'computer' | 'camera' | 'globe';
const props = defineProps<{
    selectedService: string;
    centerX: number;
    fov: number;
}>();
const { selectedService, centerX, fov } = toRefs(props);

const serviceModels: Record<string, string> = {
    video: 'camera',
    development: 'computer',
    design: 'globe',
}
const selectedModel = computed(() => serviceModels[selectedService.value]);

const lastTimeout = ref<any>();
const currentlyDisplayingModel = ref(selectedModel.value);
const shutterOpen = ref(false);
// const initialShutter = ref(true);

const renderer = ref<RendererPublicInterface>();
const camera = ref<{ camera: THREE.Camera }>();
const cursorTarget = ref(new THREE.Vector2());
const cursor = ref(new THREE.Vector2());
const canvasWrapper = ref<HTMLDivElement>();

interface Model {
    hasRendered?: boolean;
    display?: boolean;
    content?: {
        model: THREE.Object3D;
        mixer?: THREE.AnimationMixer;
    }
}
const models = ref<Record<ModelNames, Model>>({
    camera: {},
    computer: {},
    globe: {},
});

function captureCursor(e: MouseEvent) {
    cursorTarget.value.set(
        2 * (e.pageX / window.innerWidth) - 1,
        2 * (e.pageY / window.innerWidth) - 1,
    );
}
onMounted(() => {
    document.addEventListener('mousemove', captureCursor);
    const clock = new THREE.Clock();
    const troisRenderer = renderer.value!;

    troisRenderer.onBeforeRender(() => {
        const dt = clock.getDelta();

        /**
         * RESIZE
         */
        const size = canvasWrapper.value!.getBoundingClientRect();
        const width = Math.floor(size.width);
        const height = Math.floor(size.height);
        troisRenderer.renderer.setPixelRatio(window.devicePixelRatio);
        troisRenderer.renderer.setSize(width, height);

        for (const model of Object.values(models.value)) {
            if (model.content == null) {
                continue;
            }
            model.content.model.position.set(0, 0, 0);
            model.content.model.visible = model.display || false;
        }

        cursor.value.lerp(cursorTarget.value, Math.min(1, 3 * dt));

        const cam = camera.value!.camera as THREE.PerspectiveCamera;
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));

        cam.position
            .set(12, -6, 4)
            .add(right.multiplyScalar(-2 * cursor.value.x))
            .add(up.multiplyScalar(1 * cursor.value.y))

        cam.up.set(0, 0, 1);
        cam.lookAt(0, 0, 0);

        cam.setViewOffset(
            width * (2 * centerX.value), height,
            0, 0,
            width, height,
        );
    });

    troisRenderer.onAfterRender(() => {
        let allModelsRendered = true;

        for (const [name, model] of Object.entries(models.value)) {
            if (model.content != null) {
                model.hasRendered = true;
            } else {
                allModelsRendered = false;
            }
        }
        const rightModelShowing = currentlyDisplayingModel.value === selectedModel.value;
        shutterOpen.value = allModelsRendered && rightModelShowing;
    });
});
onUnmounted(() => {
    document.removeEventListener('mousemove', captureCursor);
});


function selectModel(modelName: string) {
    // display model
    for (const [name, model] of Object.entries(models.value)) {
        model.display = (name === modelName);
    }
    // controls backdrop
    currentlyDisplayingModel.value = modelName;
}

onMounted(() => {
    // initial selection without delay
    selectModel(selectedModel.value);
})

watch(selectedModel, newSelectedModel => {
    const backdropMillis = 500;

    if (lastTimeout.value) {
        clearTimeout(lastTimeout.value);
    }
    lastTimeout.value = setTimeout(() => {
        selectModel(newSelectedModel);
    }, backdropMillis);

});

</script>

<template>
    <div class="canvas-backdrop" :class="{ shutterOpen }" :style="{ '--center-x': centerX }" ref="canvasWrapper">
        <Renderer ref="renderer" :antialias="true" :auto-clear="true" :alpha="true" :resize="true">
            <Camera ref="camera" :look-at="new THREE.Vector3()" :fov="fov" />
            <Scene>
                <DirectionalLight :color="'#f2edce'" :intensity="1.2" :position="new THREE.Vector3(8, -5, 12)"
                    :look-at="new THREE.Vector3()" />
                <AmbientLight :color="'#e0f3ff'" :intensity=".5" />
                <!-- CAMERA -->
                <GltfModel :src="useAsset(`/05451335-f84f-41fd-a516-725a72051c61.glb`)"
                    @load="gltf => models.camera.content = initCamera(gltf)" />
                <!-- COMPUTER -->
                <GltfModel :src="useAsset(`/89007a80-55e6-4ea3-a12e-1aa644adddf1.glb`)"
                    @load="gltf => models.computer.content = initComputer(gltf)" />
                <!-- GLOBE -->
                <GltfModel :src="useAsset(`/eaa57964-332a-4f79-8331-8a7e8a592b52.glb`)"
                    @load="gltf => models.globe.content = initGlobe(gltf)" />
            </Scene>
        </Renderer>
    </div>
</template>

<style scoped lang='scss'>
.canvas-backdrop {
    position: relative;

    width: 100%;
    height: 100%;

    overflow: none;

    transition: clip-path 500ms;
    clip-path: circle(0% at calc(100% * var(--center-x)) 50%);

    &.shutterOpen {
        clip-path: circle(100% at calc(100% * var(--center-x)) 50%);
    }

    /* &:not(.initialShutter) {
        transition: clip-path 500ms;
    } */
}
</style>