
<template>
    <h1 class="page_title">
        <NuxtLink
            to="/"
        >
                <span class="zebra">zebra</span>
                <span class="pig">pig</span>
        </NuxtLink>
    </h1>
</template>

<style scoped lang='scss'>

.page_title > a
{
    font-size: 5rem;
    text-decoration: none;

    .zebra
    {
        font-family: 'Titan One', cursive;
        color: white;
        -webkit-text-stroke: 2px black;

        &::before
        {
            content: '> ';
        }
    }

    .pig
    {
        font-family: 'Roboto Slab', serif;
        color: #f9a195;

        &::after
        {
            content: ' &';
        }
    }

    @media only screen and (max-width: 450px)
    {
        span
        {
            &::after,
            &::before
            {
                display: none;
            }
        }
    }
}

</style>