<script setup lang="ts">

const checkbox = ref(false);

const uncheck = (e: MouseEvent) => checkbox.value = false;

onMounted(() =>
    document.addEventListener('click', uncheck)
);

onUnmounted(() =>
    document.removeEventListener('click', uncheck)
);

const navigation = useNavigation('header').data

</script>

<template>
    <header class="site-header">
        <label>
            <input type="checkbox" v-model="checkbox"/>
            <i class="fa-solid fa-bars menu-icon"></i>
            <nuxt-link :to="localePath('/')" class="logo-link"><logo/></nuxt-link>
            <div class="list">
                <navigation-link class="nav-link" :key="link.id" v-for="link in navigation?.navigation_links" :link="link" />
            </div>
        </label>
    </header>
    <div class="header-spacer"></div>
</template>

<style scoped lang='scss'>

.header-spacer
{
    height: var(--header-footer-height);
}

.logo-link{
    display: flex;
    align-items: center;
}

.nav-link{
    animation: fadeIn .4s ease;
    animation-fill-mode: backwards;
}

@for $i from 1 through 10 {
  .nav-link:nth-child(#{$i}) {
    animation-delay: #{$i*.1}s;
  }
}

@keyframes fadeIn {
    from{
        opacity: 0;
        transform: translateY(20%);
    }
    to{
        opacity: 1;
    }
}

@keyframes borderEnter {
    from{transform: scaleX(0)}
}

.site-header 
{
    width: 100%;
    height: var(--header-footer-height);
    padding: 10px 0;
    z-index: 1000;
    position: fixed;
    text-transform: uppercase;
    font-weight: bold;
    
    &::before {
        content: "";
        animation: borderEnter .8s cubic-bezier(1, 0.42, 0.21, 0.92);
        transform-origin: left center;
        position: absolute;
        height: 100%;
        border-bottom: var(--border-style);
        pointer-events: none;
        width: 100%;
        top: 0;
        left: 0;
        //mask: linear-gradient(180deg,#ffffff 60%, #ffffff00 100%);
        background-color: var(--background-color-semi-transparent);
        backdrop-filter: blur(20px);
        transition: var(--color-change-transition);
        z-index: -1;
    }

    display: flex;

}

.button{
    padding: 5px 15px;
    font-size: 1.05em;
    width: auto;
    margin-bottom: 0px;
    margin-top: 0px;
}

label
{
    display: flex;
    margin: auto;
    align-items: center;
    padding: 0 30px;
    justify-content: space-between;

    // make click transparent
    pointer-events: none;
    & > * { pointer-events: all; }

    z-index: 1;
    width: 100%;
    transition: height 0.1s;

    display: flex;

    input, .menu-icon
    {
        display: none;
    }

    a{
      color: var(--text-color);
    }

    .list
    {
        max-width: 1200px;
        width: 100%;

        display: flex;
        justify-content: flex-end;
        align-items: center;
        height: 42px;

        a
        {
            height: 100%;
            text-decoration: none;
            display: flex;
            align-items: center;
    
            font-size: 1em;

            text-shadow: none;
            margin-left: 30px;
            transition: var(--color-change-transition);
        }
    }
}

@media (max-width: 800px){

        label
        {
            padding: 0 20px;
        }

        input
        {
            position: absolute;
            width: 0;
            height: 0;
        }

        .list
        {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: unset;

            display: flex;
            flex-direction: column;
            gap: 1rem;

            padding: 1rem 2rem;

            backdrop-filter: blur(20px) saturate(2);
            
            transform: translateY(-100%);

            a
            {
                height: 4rem;
                width: 100%;
                transition: var(--color-change-transition);
                justify-content: flex-start;
            }
        }

        input:checked ~ .list
        {
            transform: none;
        }
    }

</style>