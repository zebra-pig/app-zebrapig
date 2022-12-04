<template>
    <div class="background-canvas-wrapper" ref="rootElement">
        <Renderer ref="renderer" :alpha="true" :antialias="true" resize="window">
            <Camera ref="camera" :position="cameraPosition" />
            <Scene ref="scene">
                <AmbientLight ref="backLight" :position="{x: 0, y: 0, z: -400}" :intensity="2" color="#000000" />
                <PointLight ref="mouseLight" :position="{x: 0, y: 0, z: -100}" :intensity="2" color="#000000" />
                <Mesh v-for="sphere in spheres" :position="sphere.pos" :props="{material: sphereMaterial}" :rotation="sphere.rotation">
                    <SphereGeometry :radius="sphere.radius" :widthSegments="sphere.widthSegments" :heightSegments="sphere.heightSegments"/>
                </Mesh>
            </Scene>
        </Renderer>
    </div>
</template>

<script setup lang="ts">
import anime from "animejs";
import * as THREE from 'three';
import { AmbientLight, Camera, Mesh, PointLight, Renderer, Scene, SphereGeometry } from 'troisjs';
import { RouteLocation } from 'vue-router';

const router = useRouter()

const camera = ref()
const renderer = ref()
const sphereMaterials = ref()
const scene = ref()
const backLight = ref()
const mouseLight = ref()

const cameraPosition = ref({x: 0, y: 0, z: -300})

const spheres = ref([])

const backgroundColor = ref("#ffffff")
const accentColor = ref("#000000")

const threeBackgroundColor = ref(new THREE.Color(0xffffff))
const threeAccentColor = ref(new THREE.Color(0x000000))

var sphereTextureVariables = {
    move: 0,
}

var sphereTextureCanvas = document.createElement("canvas")
var sphereTextureContext = sphereTextureCanvas.getContext("2d")
sphereTextureCanvas.width = 1000
sphereTextureCanvas.height = 1000
var sphereTexture = new THREE.CanvasTexture(sphereTextureCanvas)
sphereTexture.wrapS = THREE.RepeatWrapping;
sphereTexture.wrapT = THREE.RepeatWrapping;
sphereTexture.repeat.set( 1, 1 );

/**
 * test
 */
const sphereMaterial = new THREE.MeshStandardMaterial({
    map: sphereTexture,
    color: null,
    wireframe: true
})

// const sphereMaterial = new THREE.MeshStandardMaterial({
//     // shininess: 0.5,
//     map: sphereTexture,
//     color: null,
//     flatShading: false,
//     wireframe: false
// })

function getHex(color){
    color = color.replaceAll("#", "").replaceAll(" ", "")
    if(color.length < 6){
        color = color + `${color}`
    }
    return parseInt(color, 16)
}

watch(accentColor, () => {
    var newColor = new THREE.Color(getHex(accentColor.value))
    anime({
        ...newColor,
        duration: 500,
        targets: threeAccentColor.value,
        easing: 'easeOutQuad'
    })
})

watch(backgroundColor, () => {
    var newColor = new THREE.Color(getHex(backgroundColor.value))
    anime({
        ...newColor,
        targets: threeBackgroundColor.value,
        duration: 300,
        easing: 'easeOutQuad'
    })
})

onBeforeUnmount(() => {
    window.removeEventListener("mousemove", onMouseMove)
})


onMounted(() => {
    window.addEventListener("mousemove", onMouseMove)
    //scene.value.scene.fog = new THREE.Fog(threeBackgroundColor.value, 0, 800)

    anime({
        targets: sphereTextureVariables,
        move: 1,
        duration: 2000,
        loop: true,
        easing: 'linear'
    })


    for(let i = 0; i < 20; i++){
        let sphere = {
            radius: 20 + Math.random()*40,
            widthSegments: Math.random()*4 + 2,
            heightSegments: Math.random()*4 + 2,
            startPos: {
                x: Math.random()*500-250,
                y: Math.random()*500-250,
                z: -Math.random()*300,
            },
            endPos: {
                x: Math.random()*500-250,
                y: Math.random()*500-250,
                z: -Math.random()*300,
            },
            rotation: {
                x: Math.random() * Math.PI,
                y: Math.random() * Math.PI,
                z: Math.random() * Math.PI
            },
            pos: null,
            animationDuration: 10000 + Math.random()*15000
        }

        sphere.pos = {
            ...sphere.startPos
        }
        spheres.value.push(sphere)
    }

    for(let sphere of spheres.value){
        anime({
            ...sphere.endPos,
            targets: sphere.pos,
            // duration: 1000,
            loop: true,
            easing: 'easeInOutQuad',
            duration: sphere.animationDuration,
            direction: 'alternate',
        })
        anime({
            targets: sphere.rotation,
            x: sphere.rotation.x + Math.PI * 2,
            duration: 20000,
            loop: true,
            easing: "linear"
        })
    }

    onRouteChange(router.currentRoute.value, null)

    renderer.value.onBeforeRender(() => {
        backgroundColor.value = getComputedStyle(document.documentElement).getPropertyValue('--background-color');
        accentColor.value = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');

        sphereTextureContext.clearRect(0, 0, 1000, 1000);
        sphereTextureContext.fillStyle = threeToRgb(threeAccentColor.value)
        sphereTextureContext.fillRect(0, 0, 1000, 1000);
        sphereTextureContext.fillStyle = threeToRgb(threeBackgroundColor.value)
        for(let i = 0; i < 30; i++){
            sphereTextureContext.fillRect(0, i*100 + sphereTextureVariables.move*100 - 200, 1000, 50);
        }

        sphereMaterial.map.needsUpdate = true

        if(scene.value.scene.fog){
            scene.value.scene.fog.color = threeBackgroundColor.value
        }

        backLight.value.light.color = threeBackgroundColor.value
        mouseLight.value.light.color = threeAccentColor.value
    })
})

function threeToRgb(color){
    return `rgb(${color.r*255}, ${color.g*255}, ${color.b*255})`
}

const mouse = {
    x: 0,
    y: 0
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Make the sphere follow the mouse
  var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera.value.camera);
  var dir = vector.sub(camera.value.camera.position).normalize();
  var distance = -camera.value.camera.position.z / dir.z;
  var pos = camera.value.camera.position.clone().add(dir.multiplyScalar(distance));
  //mouseMesh.position.copy(pos);
  mouseLight.value.light.position.copy(new THREE.Vector3(pos.x, pos.y, pos.z -100));
}


router.beforeEach((to, from) => {
    try{
        onRouteChange(to, from)
    }catch(e){}
})

function onRouteChange(to: RouteLocation, from: RouteLocation){
    if(to.name == "projects-slug"){
        transitions.project()
    }
    if(to.name == "index"){
        transitions.index()
    }
    if(to.path == "/imprint"){
        transitions.imprint()
    }
}


const transitions = {
    project(){
        anime({
                targets: cameraPosition.value,
                x: mouseLight.value.light.position.x * 2,
                y: mouseLight.value.light.position.y * 2,
                z: -300,
                easing: 'easeInCubic',
                duration: 1010
        })
        anime({
                targets: camera.value.camera.rotation,
                x: 0,
                y: 0,
                z: 0,
                easing: 'easeInOutQuad',
                duration: 2000
        })
    },
    index(){
        anime({
                targets: cameraPosition.value,
                x: 0,
                y: 0,
                z: 200,
                easing: 'easeInOutQuad',
                duration: 2000
        })
        anime({
                targets: camera.value.camera.rotation,
                x: 0,
                y: 0,
                z: 0,
                easing: 'easeInOutQuad',
                duration: 2000
        })
    },
    imprint(){
        anime({
                targets: cameraPosition.value,
                x: 0,
                y: 0,
                z: 1000,
                easing: 'easeOutQuad',
                duration: 1000
        })
        anime({
                targets: camera.value.camera.rotation,
                x: 0,
                y: Math.PI/16,
                easing: 'easeOutQuad',
                duration: 1000
        })
    }
}

</script>

<style lang="scss">
.background-canvas-wrapper{
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    animation: fadeIn 2s ease;
    animation-delay: 0.5s;
    animation-fill-mode: backwards;

    canvas{
        width: 100%;
        height: 100%;
    }

    @keyframes fadeIn{
        from{
            opacity: 0;
        }
        to{
            opacity: 1;
        }
    }
}
</style>