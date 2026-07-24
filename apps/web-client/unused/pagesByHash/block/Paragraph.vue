<template>
  <p v-html="data.text"></p>
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
