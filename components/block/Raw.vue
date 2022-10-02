<template>
  <div ref="container">
    <html-content :html="data.html" />
  </div>
</template>

<script>
  import htmlContent from "./HtmlContent"

  export default {
    components: {
      htmlContent
    },
    data: () => {
      return {};
    },
    props: ['data'],
  }
</script>
