<template>
    <nuxt-link @mousemove="onMouseMove" ref="buttonElement" @mouseover="onMouseOver" @mouseleave="onMouseLeave" :class="'button '+props.class" :to="props.to"><slot/></nuxt-link>
</template>
<style scoped lang="scss">

.button{
    padding: 5px 15px;
    font-weight: bold;
    display: block;
    font-size: 0.8em;
    --webkit-apprearance: none;
    border: 0px;
    transition: transform .5s ease, var(--color-change-transition);
    background-color: var(--accent-color);
    color: var(--background-color);
    outline: 0px;
    vertical-align: middle;
    max-width: 80vw;
    text-align: center;
}
</style>
<script setup>
const props = defineProps(['to', 'class'])
const buttonElement = ref(null)
const hover = ref(false)

function onMouseOver(){
    hover.value = true
}

function onMouseLeave(){
    hover.value = false
    buttonElement.value.$el.style.transform = ''
}

function onMouseMove(e){
    if(!hover.value){
        return
    }
    const factor = 8
    const { clientX, clientY, currentTarget } = e;
    const { clientWidth, clientHeight, offsetLeft, offsetTop } = currentTarget;

    const horizontal = (clientX - offsetLeft) / clientWidth;
    const vertical = (clientY - offsetTop) / clientHeight;
    const rotateX = (factor / 2 - horizontal * factor).toFixed(2);
    const rotateY = (vertical * factor - factor / 2).toFixed(2);

    buttonElement.value.$el.style.transform =
		`perspective(${clientWidth}px) rotateX(${rotateY}deg) rotateY(${rotateX}deg) scale3d(1, 1, 1)`;
}
</script>