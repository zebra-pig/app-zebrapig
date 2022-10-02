<template>
    <div class="download-page-hero">
        <!-- <div class="hero-media" v-if="downloadPage.hero">
            <img :src="useFile(downloadPage.hero).url+'?width=1000'"/>
        </div> -->
        <download-page-preview :download-page="downloadPage" />
        <div class="title">{{ downloadPage.title }}</div>
        <div class="spacer"></div>
    </div>
</template>

<script setup>
const { downloadPage } = defineProps(["downloadPage"])


</script>

<style lang="scss" scoped>
    .download-page-hero{
        align-items: center;
        display: flex;
        flex-direction: column;
        height: 80vh;
        justify-content: flex-end;
        width: 100vw;

        .title{
            font-weight: bold;
            font-size: 30px;
        }

        .hero-media{
            width: 100%;
            position: absolute;
            top: 0px;
            width: 100vw;
            height: 100vh;
            z-index: -1;
        }

        img{
            width: 100%;
            height: 100%;
            top: 0px;
            object-fit: cover;
        }

        .spacer{
            height: 20vh;
            width: 100%;
        }
    }
</style>