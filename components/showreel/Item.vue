<template>
    <div class="showreel-item">
<div class="showreel-item-content">
    <div class="wrapper showreel-comment">
        <h2>{{ showreelItem.media.title }}</h2>
        <p v-if="showreelItem.comment">{{ showreelItem.comment }}</p>
    </div>
    <media-player class="media-player" :media="showreelItem.media"/>
</div>
</div>
</template>

<script lang="ts" setup>
const { showreelItem } = defineProps(["showreelItem"])

</script>

<style lang="scss">
.showreel-comment{
    margin-bottom: 0px;
    padding-bottom: 15px;

    @media(min-width: 1000px){
        padding-left: 0px;
        padding-right: 0px;
    }

    h2{
        margin-top: 0px;
        margin-bottom: 0px;
    }

    p{
        margin-bottom: 0px;
    }
}

.showreel-item{
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-bottom: 40px;


.showreel-item-content{
    max-width: 1000px;
    width: 100%;
}

.media-player{
    border: solid 2px var(--text-color);

    @media(max-width: 1002px){
        border-left: 0px;
        border-right: 0px;
    }

    .plyr__poster{
        border: solid 2px var(--text-color);
    }
}
}
</style>