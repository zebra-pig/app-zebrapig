<template>
    <nuxt-link 
        :style="transformations"
        :to="localePath('/projects/'+ projectPage.slug)" 
        :class="{'project-grid-card': true, 'grid-highlighted': gridHighlighted && !hover}"
        @mousemove="onMouseMove" 
        @mouseup="onMouseUp" 
        @mousedown="onMouseDown" 
        @mouseover="onHover" 
        @mouseleave="onMouseLeave"
    >
        <div style="display: none">{{ projectPage.translations[0]?.title }}</div>
        <theme-style :theme="theme" v-if="hover"/>
        <div class="image-wrapper">
            <img class="standard-image" v-if="projectPage.cover" :src="useFile(projectPage.cover) + '?width=1000'" 
                :alt="projectPage.translations[0]?.title" :title="projectPage.translations[0]?.title" />
            <img class="luminosity-image" v-if="projectPage.cover" :src="useFile(projectPage.cover) + '?width=1000'" 
            :alt="projectPage.translations[0]?.title" :title="projectPage.translations[0]?.title" />
            <div class="background-overlay"></div>
            <div class="project-info">
                <div class="project-title">{{ projectPage.translations[0]?.title }}</div>
                <div class="project-worktypes">{{ worktypes.join("+") }}</div>
                <svg class="arrow" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="ArrowForwardIcon" tabindex="-1" title="ArrowForward"><path d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"></path></svg>
            </div>
        </div>
    </nuxt-link>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    projectPage: any,
    gridHighlighted: boolean
}>(), {
    projectPage: null,
    gridHighlighted: false
})

const $emit = defineEmits(['highlighted', 'blurred'])

const projectPage = toRef(props.projectPage)

const {t} = useI18n()
const hover = ref(false)
const transformFactor = ref(2)

const localePath = useLocalePath()

const transformations = ref({
    '--rotate-x': '0', 
    '--rotate-y': '0',
});

function onMouseMove(e: MouseEvent) 
{
    const factor = transformFactor.value

    const { clientWidth: w, clientHeight: h, offsetLeft: l, offsetTop: t } = 
        e.currentTarget as HTMLDivElement;

    const u = 2 * (e.pageX - l) / w - 1;
    const v = 2 * (e.pageY - t) / h - 1;

    const rotateX = (-factor * v).toFixed(3);
    const rotateY = (factor * u).toFixed(3);

    transformations.value =
    {
        '--rotate-x': `${-rotateX}deg`, 
        '--rotate-y': `${-rotateY}deg`,
    }
}

function onHover() {
    hover.value = true
    $emit('highlighted')
}

function onMouseDown(e: MouseEvent) {
    transformFactor.value = 2
    onMouseMove(e)
}

function onMouseUp(e: MouseEvent) {
    transformFactor.value = 8
}

function onMouseLeave() {
    hover.value = false
    $emit('blurred')
}

onBeforeUnmount(() => {
    document.removeEventListener("mousemove", (e) => {onMouseMove(e)})
})


const worktypes = computed(() => {
    var wtypes = []
    if(projectPage){
        for(var worktypeConnection of projectPage.value.worktypes){
            wtypes.push(worktypeConnection.worktype.translations[0]?.title)
        }
    }
    return wtypes
})

const theme = computed(() => {
    return {
        backgroundColor: projectPage.value.background_color || "#ffffff",
        textColor: projectPage.value.text_color || "#000000",
        accentColor: projectPage.value.accent_color || "#000000",
    }
})

// const themeVars = computed(() => {
//     return {
//         '--background-color': projectPage.background_color || "#ffffff",
//         '--background-color-semi-transparent': projectPage.background_color+"80" || "#ffffff80",
//         '--text-color': projectPage.text_color || "#000000",
//         '--accent-color': projectPage.accent_color || "#000000",
//     }
// })

</script>

<style scoped lang="scss">


@keyframes cardFadeIn {
    0%{
        opacity: 0;
        transform: translateY(50%);
    }
    100%{
        opacity: 1;
        transform: translateY(0%);
    }
}
.project-grid-card{

    &:hover
    {
        transform: perspective(500px) rotateX(var(--rotate-x)) rotateY(var(--rotate-y)) scale3d(1, 1, 1);
    }

    &:not(:hover){
        transition: transform .8s ease, opacity .8s ease;
    }

    width: 100%;
    animation: cardFadeIn 1s cubic-bezier(0.38, 0.56, 0, 0.98);
    animation-fill-mode: backwards;
    z-index: 10;

    flex-grow: 0;
    flex-shrink: 0;

    @for $i from 1 through 100 {
        &:nth-child(#{$i+1}) {
            animation-delay: #{$i * 0.1}s;
        }
    }

    @media (max-width: 1500px) {
        font-size: .8em;
    }
        

    @media (max-width: 768px) {
        font-size: 0.6em;
    }

    @media (max-width: 480px) {
        margin-bottom: 2em;
    }

    .image-wrapper{
        width: 100%;
        aspect-ratio: 3/4;
        overflow: hidden;
        position: relative;
        transition: transform 0.8s cubic-bezier(0.075, 0.82, 0.165, 1), opacity .8s ease;
    }

    .project-info{
        position: absolute;
        bottom: 0;
        left: 0;
        height: 100%;
        width: 100%;
        padding: 0.5em;
        opacity: 0;
        transition: transform 1s cubic-bezier(0.075, 0.82, 0.165, 1), opacity .8s ease;
        padding: 1.5em;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;

        transform: translate3d(0, 100%, 20px) perspective(1000px);
        
        @media (max-width: 480px) {
            transform: none;
            opacity: 1;
        }

        .project-title{
            font-size: 5em;
            font-weight: 1000;
            text-transform: uppercase;
            line-height: 0.9em;
            color: var(--text-color);
        }

        .project-worktypes{
            font-size: 1.5em;
            font-weight: 100;
            text-transform: uppercase;
            line-height: 1.2em;
            margin-top: 1.5em;
            opacity: 0.8;
            color: var(--text-color);
        }

        .arrow{
            margin-top: 1em;
            width: 8em;
            height: 8em;
            margin-left: auto;
            outline: 0;
            transform: translateX(-200px);
            transition: transform 1s cubic-bezier(0.075, 0.82, 0.165, 1), opacity .8s ease;
            path{
                fill: var(--text-color);
                stroke: var(--text-color);
                stroke-width: 0px;
                transition: fill .5s ease, stroke-width .5s ease;
            }

            &:hover{
                path{
                    fill: var(--text-color-transparent);
                    stroke-width: .5px;
                }
            }

            @media (max-width: 480px) {
                transform: none;
            }
        }
    }

    .background-overlay{
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        backdrop-filter: blur(20px);
        background-color: var(--background-color-semi-transparent);
        transition: opacity .3s ease;

        @media (max-width: 480px) {
            opacity: 1;
            mask: linear-gradient(45deg, #ffffff 30%, #ffffff00 100%);
        }
    }

    img{
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 1s cubic-bezier(0.075, 0.82, 0.165, 1);
    }

    &:hover{
        img{
            transform: scale(1.05);
        }

        .project-info{
            opacity: 1;
            transform: translate3d(0, 0, 100px) perspective(1000px);
        }

        .background-overlay{
            opacity: 1;
        }

        .arrow{
            transform: translateX(0);
        }
    }
}

.grid-highlighted{
    transform: scale(0.95);
    opacity: 0.7;
    mix-blend-mode: luminosity;

    .default-image{
        opacity: 0;
    }
}

.luminosity-image{
    position: absolute;
    top: 0;
    left: 0;
    mix-blend-mode: luminosity;
}

</style>