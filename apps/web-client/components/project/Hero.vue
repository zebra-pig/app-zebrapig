<template>
    <div class="project-hero">
        <img :src="useFile(file)"/>
    </div>
</template>

<script setup>
const { file } = defineProps(["file"])

onMounted(() => {
    
})
</script>

<style scoped lang="scss">
.project-hero{
    transform-origin: bottom center;
    width: 100%;
    height: 80vh;

    img, video{
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
    }
}

</style>