<template>
    <video ref="playerElement" class="player" playsinline controls v-if="mediaData">
        <source :src="source.src" v-for="source in sources" :type="source.type"/>
    </video>
    <!-- {{ playbacks }} -->
</template>


<script setup>
import Plyr from 'plyr';
import Hls from "hls.js";

const { media } = defineProps(["media"])

const playerElement = ref()
const {data: mediaData} = useFetch("https://api.vod2.infomaniak.com/res/media/"+media.external_id+".json")


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
        poster: mediaData.value.poster.url
    }

    console.log(settings)

    const player = new Plyr(playerElement.value, settings);
})

function generateThumbnailVtt(media){
    const w = 172,
    h = 129,
    row = 10,
    interval = media.duration/100,
    aspect = 1920/900

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
    width: 90vw;

    --plyr-color-main: #888888;
}
</style>