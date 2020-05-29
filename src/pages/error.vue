<template>
    <div>
        <ErrorDisplay
            :error-code="error.statusCode"
            :error-message="error.message"
        />
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import ErrorDisplay from '@/components/common/ErrorDisplay.vue'
import { appStore } from '@/store'

@Component({
    components: { ErrorDisplay }
})
export default class ErrorPage extends Vue {
    @Prop() error!: any

    mounted (): any {
        appStore.merge({
            pageTitle: this.$t('Pages.Error.Name', { code: this.error.statusCode }),
            innerTitle: this.$t('Pages.Error.Codes.' + this.error.statusCode)
        })
    }
}
</script>
