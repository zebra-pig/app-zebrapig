<template>
    <div class="signature">
        <div class="showreel-signature-container" v-if="signature.content" v-html="signature.content"></div>
        {{ signature.name }}
    </div>
</template>

<script setup lang="ts">
const { signature } = defineProps(["signature"])
</script>

<style lang="scss" scoped>
.signature{
    margin-bottom: 20px;
    text-align: center;
}
</style>

<style lang="scss">
.showreel-signature-container{
    svg{
        width: 140px;
        height: 60px;

        @media(max-width: 800px){
            width: 100px;
            height: 40px;
        }

        path{
            fill: var(--text-color) !important;
        }
    }
}
</style>