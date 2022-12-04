<template>
  <component :is="'h'+data.level">{{ data.text }}</component>
</template>

<script>

  export default {
    components: {

    },
    data: () => {
      return {};
    },
    props: ['data'],
  }
</script>
