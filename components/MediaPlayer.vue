<template>
    <video ref="playerElement" class="player" @play="startMediaSession" @pause="onPause" playsinline :data-poster="mediaData.poster.url" :poster="mediaData.poster.url" controls v-if="mediaData">
        <source :src="source.src" v-for="source in sources" :type="source.type"/>
    </video>
    <!-- {{ playbacks }} -->
</template>


<script setup>
import Plyr from 'plyr';
import Hls from "hls.js";

const { media } = defineProps(["media"])

const playerElement = ref()
const {data: mediaData} = await useFetch(() => `https://api.vod2.infomaniak.com/res/media/${media.external_id}.json`, {
    key: "vod-"+media.external_id
})


watch(mediaData, () => {
    initPlayer()
})

function startMediaSession(){
    if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: media.title,
            artist: "Zebra & Pig",
            artwork: [
                { src: mediaData.value.poster.url, size: '1920x1080', type: 'image/jpeg' },
            ]
        });
    }

    navigator.mediaSession.playbackState = 'playing';

    navigator.mediaSession.setActionHandler('play', async () => {
        await playerElement.value.play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
        playerElement.value.pause();
    });

    const defaultSkipTime = 10; /* Time to skip in seconds by default */

    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skipTime = details.seekOffset || defaultSkipTime;
        playerElement.value.currentTime = Math.max(playerElement.value.currentTime - skipTime, 0);
    });

    navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skipTime = details.seekOffset || defaultSkipTime;
        playerElement.value.currentTime = Math.min(playerElement.value.currentTime + skipTime, playerElement.value.duration);
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.fastSeek && 'fastSeek' in playerElement.value) {
            playerElement.value.fastSeek(details.seekTime);
            return;
        }
        playerElement.value.currentTime = details.seekTime;
    });
}

function onPause(){
    navigator.mediaSession.playbackState = 'paused';
}

const playbacks = computed(() => {
    var data = mediaData?.value?.playbacks[Object.keys(mediaData.value.playbacks)[0]]
    return data
})

const sources = computed(() => {
    var sources = []

    var i = 0
    for(var playback of playbacks.value.single){
        sources.push({
            src: playback.url,
            type: playback.mimetype,
            size: mediaData.value.encoded_medias[i]?.encoding_stream.video_height
        })

        i++
    }

    return sources
})

onMounted(async () => {
    initPlayer()
})

async function initPlayer(){
    if (Hls.isSupported()) {
        var hls = new Hls();
        hls.loadSource(playbacks.value.hls_canonical.url);
        hls.attachMedia(playerElement.value);
    }

    var thumbnailVttUrl = generateThumbnailVtt(mediaData.value);
    const settings = {
        previewThumbnails: {
            enabled: true,
            src: thumbnailVttUrl
        },

        sources: sources.value,
        poster: mediaData.value.poster.url,
        keyboard: {
            focused: true,
            global: true
        },
        duration: media.duration
    }

    console.log(settings)

    if(!navigator.userAgent.match(/ipad|ipod|iphone/i)){
        const player = new Plyr(playerElement.value, settings);
    }
}

function generateThumbnailVtt(media){
    const w = 172,
    h = 129,
    row = 10,
    interval = media.duration/100,
    aspect = 1920/1080

    function secondsToSMPTE(seconds, framerate) {
        var f = Math.floor((seconds % 1) * framerate);
        var s = Math.floor(seconds);
        var m = Math.floor(s / 60);
        var h = Math.floor(m / 60);
        m = m % 60;
        s = s % 60;

        return {h: h, m: m, s: s, f: f};
    }


    function SMPTEToString(timecode) {
        if (timecode.h < 10) { timecode.h = "0" + timecode.h; }
        if (timecode.m < 10) { timecode.m = "0" + timecode.m; }
        if (timecode.s < 10) { timecode.s = "0" + timecode.s; }
        if (timecode.f < 10) { timecode.f = "0" + timecode.f; }

        return timecode.h + ":" + timecode.m + ":" + timecode.s + ".000";
    }

    function timecode(time){
        return SMPTEToString(secondsToSMPTE(time))
    }

    const thumbAspect = w/h
    var cutX = (h - (1/aspect)*w)/2
    console.log(cutX)
    

    var fileUrl = media.preview.video.url

    var ccol = 0, crow = 0
    
    var vtt = `WEBVTT

`

    var i = 1
    for(var t = 0; t < media.duration; t += interval){
        vtt += `${i}
${timecode(t)} --> ${timecode(t + interval)}
${fileUrl}#xywh=${crow*w},${ccol*h + cutX},${w},${h - cutX*2}

`
        i++
        crow += 1
        if(crow == row){
            crow = 0
            ccol += 1
        }
    }


    return "data:text/plain;base64,"+btoa(vtt);
}

</script>

<style lang="scss">
@import "plyr/src/sass/plyr.scss";


.plyr, .player{
    width: 100%;
}
</style>