<template>
    <div class="showreel-hero">
        <img v-if="showreel.hero" :src="useFile(showreel.hero).url + '?width=1000'"/>
        <h1>{{ showreel.title }}</h1>
        <p>{{ showreel.comments }}</p>
    </div>
</template>

<script setup>
const { showreel } = defineProps(["showreel"])
</script>

<style lang="scss">
    .showreel-hero{
        height: 400px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        border-bottom: 2px solid var(--text-color);

        h2{
            text-align: center;
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