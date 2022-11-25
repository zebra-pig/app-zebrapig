<template>
    <h1 class="title">{{ dropzone.title }}</h1>
    <p class="comment" v-if="dropzone.comment">{{ dropzone.comment }}</p>
    <div class="container">
        <div class="upload-form dropzone" :ref="uploadForm" id="upload-form"></div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Dropzone from "dropzone";
import {useI18n} from "vue-i18n"

const uploadForm = ref();

const route = useRoute()
const { t } = useI18n()

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
        url: "/api/dropzone/"+dropzone.value.hash,
        maxFilesize: 5000,
        parallelUploads: 20,
        dictDefaultMessage: `<span class="material-symbols-outlined upload-icon">cloud_upload</span><div>${t('drag_and_drop')}</div>`
    });

    dropzoneElement.on("addedfile", file => {
        console.log(`File added: ${file.name}`);
    });
})

</script>

<style lang="scss" scoped>

.title{
    text-align: center;
    padding: 20px;
    width: 100%;
}


.comment{
    white-space: pre-wrap;
    text-align: center;
    padding: 20px;
    margin: auto;
    max-width: 800px;
    text-align: center;
}

.container{
    display: flex;
    justify-content: center;
}

.upload-form{
    max-width: 800px;
    margin: 20px;
    width: 100%;
    border: 2px solid var(--text-color);
    border-radius: 0px;
    min-height: 255px;

    animation: fade-in 1.5s ease;
    animation-fill-mode: backwards;
    animation-delay: .5s;
}

@keyframes fade-in{
    0%{
        opacity: 0;
    }

    100%{
        opacity: 1;
    }
}

</style>

<style lang="scss">
@use "dropzone/dist/dropzone.css";


.dropzone{
    color: var(--text-color) !important;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-wrap: wrap;
    flex-direction: row;

    .upload-icon{
        font-size: 80px;
    }

    .dz-message, .dz-button{
        width: 100%;
    }
    
    .dz-preview, *{
        border-radius: 0px !important;
    }

    .dz-details{
        color: var(--text-color) !important;
        span{
            background: var(--text-color-semi-transparent);
        }
    }

    .dz-image{
        background: var(--background-color) !important;
        border: 2px solid var(--text-color) !important;
    }
}
</style>