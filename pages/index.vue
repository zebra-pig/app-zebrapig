<script setup lang='ts'>

const { public: { APP_NAME } } = useRuntimeConfig();
const { t } = useI18n();

useHead({
    title: APP_NAME,
    titleTemplate: '%s', // removes -
    meta: [
        {
            name: "description",
            content: t('meta.description.index')
        }
    ]
})
const settingsData = useSettings().data

const serviceLinks = await useServices();
const activeService = ref(0);
const carouselInterval = ref<number>();
function clearAndStartInterval() {
    window.clearInterval(carouselInterval.value);
    carouselInterval.value = window.setInterval(() => {
        activeService.value = (activeService.value + 1) % serviceLinks.value!.length;
    }, 8000);
}
function setActive(index: number) {
    activeService.value = index;
    clearAndStartInterval();
}
onMounted(() => clearAndStartInterval());
onUnmounted(() => window.clearInterval(carouselInterval.value));


const isMobile = ref<boolean | undefined>();
const resizeHandler = () => isMobile.value = window.innerWidth <= 768;
onMounted(() => {
    window.addEventListener('resize', resizeHandler);
    resizeHandler();
});
onUnmounted(() => window.removeEventListener('resize', resizeHandler));

</script>

<template>
    <div>
        <div class="scroll-container">
            <div class="fixed-three">
                <client-only>
                    <service-three-backdrop :selected-service="serviceLinks?.[activeService]?.display_tag!"
                        :center-x="isMobile ? 0.5 : 0.65" :fov="isMobile ? 50 : 35"/>
                </client-only>
            </div>
            <service-links-mobile class="mobile-service-links" :serviceLinks="serviceLinks" :activeService="activeService"
                @setActive="setActive" />
            <service-links-desktop class="desktop-service-links" :serviceLinks="serviceLinks" :activeService="activeService"
                @setActive="setActive" />
            <div class="quote-container" v-if="settingsData">
                <h1><a :href="'mailto:' + APP_NAME + '<' + settingsData.settings.email + '>'">{{ settingsData.settings.email
                }}</a>
                </h1>
                <h1><a :href="'tel:' + settingsData.settings.phone">{{ settingsData.settings.phone }}</a></h1>
            </div>
        </div>
    </div>
</template>

<style scoped lang='scss'>
@media (max-width: 768px) {
    .desktop-service-links {
        display: none;
    }
}

@media (min-width: 769px) {
    .mobile-service-links {
        display: none;
    }
}

.scroll-container {
    background-color: var(--background-color);

    position: relative;
    z-index: 0;

    .fixed-three {
        position: fixed;
        width: 100%;
        height: 100%;
        z-index: -1;
    }

    @keyframes fadeSlide {
        from {
            transform: translateY(50%);
            opacity: 0;
        }
    }

    .quote-container {
        position: absolute;
        bottom: 0;
        z-index: 1;
        animation-delay: 5s;
        animation-fill-mode: forwards;
        animation: fadeSlide 1s cubic-bezier(0, 0.61, 0, 0.93);

        width: 100%;

        display: flex;
        align-items: center;
        justify-content: center;

        border-top: var(--border-style);
        border-bottom: var(--border-style);

        transition: var(--color-change-transition);
        background-color: var(--background-color);

        h1 {
            font-size: 40px;
            margin: 1ch;
        }

        @media(max-width: 800px) {
            display: block;

            h1 {
                font-size: 25px;
            }
        }

    }
}

.page-enter-active,
.page-leave-active {
    transition: all .2s ease-out;
}

.wrapper {
    display: flex;
    justify-content: center;
}

.index-page {
    &.page-leave-active {
        transition: all 0.5s ease-in;
    }

    &.page-leave-to {
        .project-grid-card {
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