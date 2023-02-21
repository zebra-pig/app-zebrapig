<template>
    <div class="video-heading">
        
        <div class="video-mask">
            <video ref="playerElement" class="video" muted loop autoplay playsinline v-if="mediaData">
                <source :src="source.src" v-for="source in sources" :type="source.type" />
            </video>
        </div>

        <h1>{{ t('video') }}</h1>
    </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import Hls from "hls.js";

const { t } = useI18n()
const {media} = defineProps(["media"])
const mediaId = ref('1jhvl2uqhf4dv')

const playerElement = ref()
const {data: mediaData} = await useFetch(() => `https://api.vod2.infomaniak.com/res/media/${mediaId.value}.json`, {
    key: mediaId.value
})

onMounted(async () => {
    initPlayer()
})

async function initPlayer() {
    if (Hls.isSupported()) {
        var hls = new Hls();
        hls.loadSource(playbacks.value.hls_canonical.url);
        //hls.attachMedia(playerElement.value);
    }

    playerElement.value.play()
}

const playbacks = computed(() => {
    var data = mediaData?.value?.playbacks[Object.keys(mediaData.value.playbacks)[0]]
    return data
})

const sources = computed(() => {
    var sources = []

    var i = 0
    for (var playback of playbacks.value.single) {
        sources.push({
            src: playback.url,
            type: playback.mimetype,
            size: mediaData.value.encoded_medias[i]?.encoding_stream.video_height
        })

        i++
    }

    return sources
})

</script>

<style scoped lang="scss">
.video-heading{
    position: relative;
    height: 600px;
    display: flex;
    align-items: center;
    justify-content: center;

    h1{
        font-weight: 900;
        font-size: clamp(50px, 20vw, 200px);
        margin: 0;
        padding: 0;
        animation: h1Fade 1s cubic-bezier(0.34, 0.59, 0, 1.01);
        animation-fill-mode: backwards;
    }

    @keyframes h1Fade {
        from{
            transform: translateY(40%);
            opacity: 0;
        }
    }

    .video{
        object-fit: cover;
        width: 100vw;
        height: 100%;
        animation: videoFadeIn 2s ease-out;
        animation-delay: 1s;
        animation-fill-mode: backwards;
    }

    @keyframes videoFadeIn {
        from{
            opacity: 0;
        }
    }

    .video-mask{
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: -1;
        animation: videoMaskEnter 10s ease-out;
        overflow: hidden;
        width: 100%;
        height: 100%;
        position: absolute;
    }

    @keyframes videoMaskEnter{
        from{
            width: calc(600px / 3 * 4);
            height: 100%;
        }
    }
}
</style>