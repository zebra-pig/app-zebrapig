<template>
<ul class="block-checklist">
  <li v-for="item in data.items">
    <v-checkbox class="block-checklist-checkbox" v-model="item.checked" color="var(--article-primary-color)"></v-checkbox>
    <span v-html="item.text"></span>
  </li>
</ul>

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
