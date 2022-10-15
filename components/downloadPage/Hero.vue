<template>
    <div class="download-page-hero">
        <!-- <div class="hero-media" v-if="downloadPage.hero">
            <img :src="useFile(downloadPage.hero).url+'?width=1000'"/>
        </div> -->
        <download-page-preview :download-page="downloadPage" />
        <div class="title">{{ downloadPage.title }}</div>
        <btn class="download-btn" v-if="downloadPage.download" target="_blank" :to="downloadPage.download_url">{{ t("download") }}</btn>
        <div class="spacer"></div>
    </div>
</template>

<script setup>
const { downloadPage } = defineProps(["downloadPage"])
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

</script>

<style lang="scss" scoped>
    .download-btn{
        font-size: 15px;
        margin-top: 20px;
        text-transform: uppercase;
    }

    .download-page-hero{
        align-items: center;
        display: flex;
        flex-direction: column;
        height: 80vh;
        justify-content: flex-start;
        width: 100vw;

        .title{
            font-weight: bold;
            font-size: 30px;
            margin-top: 20px;
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