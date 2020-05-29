<template>
    <v-card>
        <v-card-text
            class="text--primary"
            v-html="$t('Pages.Legal.Text')"
        />
    </v-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { appStore } from '@/store'

@Component({})
export default class LegalPage extends Vue {
    mounted () {
        appStore.merge({
            pageTitle: this.$t('Pages.Legal.Name')
        })
    }
}
</script>
