<template>
    <div class="showreel-hero">
        <img v-if="showreel.hero" :src="useFile(showreel.hero) + '?width=1000'"/>
        <h1>{{ showreel.title }}</h1>
        <p class="comment">{{ showreel.comment }}</p>
        <signature :signature="showreel.signature" v-if="showreel.signature"/>
    </div>
</template>

<script setup>
const { showreel } = defineProps(["showreel"])
</script>

<style lang="scss">
    .showreel-hero{
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        border-bottom: 2px solid var(--text-color);

        .comment{
            padding: 20px;
            max-width: 600px;
            text-align: center;
            white-space: pre-wrap;
        }

        h2{
            text-align: center;
        }

        p{
            margin-bottom: 30px;
        }

        img{
            width: 100%;
            height: 100%;
            position: absolute;
            opacity: .6;
            object-fit: cover;
            z-index: -1;
        }
    }
</style>