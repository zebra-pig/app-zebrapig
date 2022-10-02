<template>
  <v-simple-table class="block-table elevation-4">
    <template v-slot:default>
      <table>
        <tbody>
          <tr v-for="row in data.content">
            <td v-for="column in row" v-html="column"></td>
          </tr>
        </tbody>
      </table>
    </template>
  </v-simple-table>
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
