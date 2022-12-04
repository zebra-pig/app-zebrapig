<template>
    <div class="background-canvas-wrapper" ref="rootElement"></div>
</template>

<script setup>
import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import anime from "animejs"

const currentScene = ref(null)

const destroyed = ref(false)

const rootElement = ref(null)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});

var threeBackgroundColor = new THREE.Color();
var threeAccentColor = new THREE.Color();

const mouseLight = new THREE.PointLight( 0xFFFFFF ); // soft white light
mouseLight.position.z = -100;
scene.add( mouseLight );

const backLight = new THREE.AmbientLight( 0x000000 );
backLight.color = threeBackgroundColor;
backLight.position.z = -400;
scene.add(backLight)

renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = -300;

var sceneFog = new THREE.Fog(threeBackgroundColor, 0, 600);
sceneFog.color = threeBackgroundColor
scene.fog = sceneFog

var accentColor = ref()
var backgroundColor = ref()
var colorIsChanging = false

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
// document.body.append(sphereTextureCanvas)


var spheres = []
var sphereMaterial = new THREE.MeshStandardMaterial({
  flatShading: false,
  shininess: 0,
  map: sphereTexture,
  wireframe: true,
});

// var sphereMaterial = new THREE.MeshPhysicalMaterial({  
//   roughness: 1,  
//   transmission: 1,  
//   thickness: 0.5, // Add refraction!
//   color: accentColor.value
// });

watch(backgroundColor, changeBackgroundColor)
watch(accentColor, changeAccentColor)

function getHex(color){
    color = color.replaceAll("#", "").replaceAll(" ", "")
    if(color.length < 6){
        color = color + `${color}`
    }
    return parseInt(color, 16)
}

function changeAccentColor(){
    var newColor = new THREE.Color(getHex(accentColor.value))
    anime({
        ...newColor,
        duration: 500,
        targets: threeAccentColor,
        easing: 'easeOutQuad'
    })
}

function changeBackgroundColor(){
    var newColor = new THREE.Color(getHex(backgroundColor.value))
    anime({
        ...newColor,
        targets: threeBackgroundColor,
        duration: 300,
        easing: 'easeOutQuad'
    })
}


for(var i = 0; i < 20; i++){
    var sphere = {}
    sphere.geometry = new THREE.SphereGeometry( 20 + Math.random()*40, Math.random()*4 + 2, Math.random()*4 + 2);
    sphere.material = sphereMaterial
    sphere.mesh = new THREE.Mesh( sphere.geometry, sphere.material );

    sphere.startPos = {
        x: Math.random()*500-250,
        y: Math.random()*500-250,
        z: -Math.random()*300,
    }
    sphere.mesh.position.set(sphere.startPos.x, sphere.startPos.y, sphere.startPos.z)

    sphere.endPos = {
        x: Math.random()*500-250,
        y: Math.random()*500-250,
        z: -Math.random()*300,
    }

    sphere.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)

    sphere.animationDuration = 10000 + Math.random()*15000
    scene.add(sphere.mesh);
    spheres.push(sphere)
}

onMounted(() => {
    rootElement.value.appendChild(renderer.domElement)
    animate();

    anime({
        targets: sphereTextureVariables,
        move: 1,
        duration: 2000,
        loop: true,
        easing: 'linear'
    })

    anime({
        targets: camera.position,
        x: 0,
        z: 200,
        easing: 'easeOutCubic',
        duration: 3000
    })

    window.addEventListener("resize", onResize)
    window.addEventListener("mousemove", onMouseMove)

    for(var sphere of spheres){
        anime({
            ...sphere.endPos,
            targets: sphere.mesh.position,
            duration: 1000,
            loop: true,
            easing: 'easeInOutQuad',
            duration: sphere.animationDuration,
            direction: 'alternate',
        })
    }
})

onBeforeUnmount(() => {
    window.removeEventListener("resize", onResize)
    window.removeEventListener("mousemove", onMouseMove)
    setTimeout(() => {
        destroyed.value = true
    }, 2000)
})

function onResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    if(destroyed.value){
        return;
    }
	requestAnimationFrame( animate );

    sphereTextureContext.clearRect(0, 0, 1000, 1000);
    sphereTextureContext.fillStyle = threeToRgb(threeAccentColor)
    sphereTextureContext.fillRect(0, 0, 1000, 1000);
    sphereTextureContext.fillStyle = threeToRgb(threeBackgroundColor)
    for(var i = 0; i < 30; i++){
        sphereTextureContext.fillRect(0, i*100 + sphereTextureVariables.move*100 - 200, 1000, 50);
    }

    sphereMaterial.needsUpdate = true


    for(var sphere of spheres){
        sphere.mesh.rotation.x += 0.01;
        sphere.mesh.position.x = sphere.mesh.position.x
        sphere.material.map.needsUpdate = true
    }

	renderer.render( scene, camera );

    backgroundColor.value = getComputedStyle(document.documentElement).getPropertyValue('--background-color');
    accentColor.value = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');

    if(document.querySelector("section.wrapper.toProject-leave-active")){
        currentScene.value = "project"
    }

    if(document.querySelector("section.wrapper.toProject-enter-active") != null){
        currentScene.value = "index"
    }
}


watch(currentScene, (val) => {
    transitions[val]();
})

const transitions = {
    project(){
        anime({
                targets: camera.position,
                x: mouseLight.position.x*1.5,
                y: mouseLight.position.y*1.5,
                z: -300,
                easing: 'easeInCubic',
                duration: 1010
        })
    },
    index(){
        anime({
                targets: camera.position,
                x: 0,
                y: 0,
                z: -300,
                easing: 'easeOutCubic',
                duration: 3000
        })
    }
}


function threeToRgb(color){
    return `rgb(${color.r*255}, ${color.g*255}, ${color.b*255})`
}

var mouse = {
    x: 0,
    y: 0,
}
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Make the sphere follow the mouse
  var vector = new THREE.Vector3(mouse.x, mouse.y, 0.5);
  vector.unproject(camera);
  var dir = vector.sub(camera.position).normalize();
  var distance = -camera.position.z / dir.z;
  var pos = camera.position.clone().add(dir.multiplyScalar(distance));
  //mouseMesh.position.copy(pos);

  mouseLight.position.copy(new THREE.Vector3(pos.x, pos.y, pos.z -100));
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