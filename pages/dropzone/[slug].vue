<template>
    <h1 class="title">{{ dropzone.title }}</h1>
    <div class="container">
        <div class="upload-form" :ref="uploadForm" id="upload-form"></div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Dropzone from "dropzone";

const uploadForm = ref();

const route = useRoute()


const { data } = await useDropzones(route.params.slug)

const title = computed(() => {
    return data?.value?.dropzones[0] ? data.value.dropzones[0].title : ''
})

const dropzone = computed(() => {
    return data?.value?.dropzones[0]
})

useHead({
    title
})

onMounted(() => {
    let dropzoneElement = new Dropzone("#upload-form", {
        url: "/api/dropzone/"+dropzone.value.hash
    });

    dropzoneElement.on("addedfile", file => {
        console.log(`File added: ${file.name}`);
    });
})

</script>

<style lang="scss" scoped>
@use "dropzone/dist/dropzone.css";

.title{
    text-align: center;
    padding: 20px;
    width: 100%;
}

.container{
    display: flex;
    justify-content: center;
}

.upload-form{
    height: 200px;
    max-width: 800px;
    margin: 20px;
    width: 100%;
    border: 2px solid var(--text-color);
}

</style>

<style lang="scss">
.upload-form{


}
</style>