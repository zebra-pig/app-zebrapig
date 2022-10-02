<template>
    <footer class="footer">
        <div class="wrapper">
            <div class="copyright">© {{ APP_NAME }} {{ new Date().getFullYear() }}</div>
            <div class="links">
                <language-switcher/>
                <navigation-link :link="link" v-for="link in navigation?.navigation_links" :key="link.id" />
            </div>
        </div>
    </footer>
</template>

<script setup>
const { public: { APP_NAME } } = useRuntimeConfig();
const navigation = useNavigation("footer").result;

</script>

<style scoped lang="scss">
.footer {
    width: 100%;
    text-transform: uppercase;
    font-size: .8em;
    color: var(--text-color);
    transition: var(--color-change-transition);
}

.copyright{
    display: inline-block;
    opacity: .6;
}

.links{
    display: flex;
    justify-content: flex-end;
    float: right;

    a{
        text-decoration: none;
        opacity: .6;
    }
}

</style>