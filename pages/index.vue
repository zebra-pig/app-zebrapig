<script setup lang='ts'>
    
import ServiceLinksDesktop from "../components/ServicesThree/ServiceLinksDesktop.vue";
import ServiceLinksMobile from "../components/ServicesThree/ServiceLinksMobile.vue";
import ThreeCanvas from "../components/ServicesThree/ThreeCanvas.vue";

const { public: { APP_NAME } } = useRuntimeConfig();

useHead({
    title: APP_NAME,
})

const clipHeight = ref('0px');

const onScroll = () => clipHeight.value = `${window.scrollY}px`

onMounted(() => window.addEventListener('scroll', onScroll));
onUnmounted(() => window.removeEventListener('scroll', onScroll));

/**
 * SERVICES
 */

const { serviceLinks, numberServices } = useServices();
const activeService = ref(0);

const carouselInterval = ref<number>();

function clearAndStartInterval()
{
    window.clearInterval(carouselInterval.value);

    carouselInterval.value = window.setInterval(() =>
    {
        activeService.value = (activeService.value + 1) % numberServices;
    }, 8000);
}

function setActive(index: number)
{
    activeService.value = index;
    clearAndStartInterval();
}

onMounted(() => clearAndStartInterval());
onUnmounted(() => window.clearInterval(carouselInterval.value));

const isMobile = ref<boolean | undefined>();

const resizeHandler = () => isMobile.value = window.innerWidth < 768;

onMounted(() => 
{
    window.addEventListener('resize', resizeHandler);
    resizeHandler();
});
onUnmounted(() => window.removeEventListener('resize', resizeHandler));


</script>

<template>
    <div>
        <div class="scroll-container">
            <div 
                class="fixed-three"
                :style="{ '--clip-height': clipHeight }"
            >
                <client-only>
                    <three-canvas
                        :activeService="activeService"
                        :marginLeft="isMobile ? 0 : 400"
                        :fov="isMobile ? 45 : 35"
                        :numberOfServices="numberServices"
                    />
                </client-only>
            </div>
            <service-links-mobile 
                v-if="isMobile"
                :serviceLinks="serviceLinks"
                :activeService="activeService"
                @setActive="setActive"
            />
            <service-links-desktop
                v-else
                :serviceLinks="serviceLinks"
                :activeService="activeService"
                @setActive="setActive"
            />
            <div class="quote-container">
                <h1>Lorem ipsum dolor</h1>
            </div>
        </div>
        <section class="wrapper">
            <project-grid />
        </section>
    </div>
</template>

<style scoped lang='scss'>

.scroll-container
{
    background-color: var(--background-color);

    position: relative;
    z-index: 0;

    .fixed-three
    {
        position: fixed;
        
        width: 100%;
        height: 90vh;
        z-index: -1;

        --clip-height: 0px;

        $h: calc(90vh - var(--clip-height));

        clip-path: polygon(
            0    0, 
            0    $h,
            100% $h,
            100% 0
        );
    }

    .quote-container
    {
        z-index: 1;

        width: 100%;

        display: flex;
        align-items: center;
        justify-content: center;

        border-top: var(--border-style);
        border-bottom: var(--border-style);

        transition: var(--color-change-transition);
        background-color: var(--background-color);

        h1 
        { 
            font-size: 40px; 
            margin: 1ch;
        } 
    }
}

.page-enter-active,
.page-leave-active {
    transition: all .2s ease-out;
}

.wrapper
{
    display: flex;
    justify-content: center;
}

.index-page
{
    &.page-leave-active
    {
        transition: all 0.5s ease-in;
    }

    &.page-leave-to {
        .project-grid-card{
            transition: all 0.5s ease-in;
            transform: translateY(120vh);
            opacity: 0;

            @for $i from 1 through 100 {
                &:nth-child(#{$i+1}) {
                    transition-delay: #{$i * 0.05}s;
                }
            }
        }
    }
}

</style>