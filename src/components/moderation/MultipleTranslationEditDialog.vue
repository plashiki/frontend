<template>
    <v-card>
        <v-card-title>
            {{ $t('Common.Form.Edit') }}
        </v-card-title>

        <v-divider />
        <v-progress-linear
            :active="loading"
            color="primary"
            indeterminate
        />

        <ErrorAlert :error="error" />


        <v-card-text>
            <TranslationForm
                v-if="editable !== null"
                ref="form"
                v-model="valid"
                :form="editable"
                :no-url="!single"
                allow-empty
            />
        </v-card-text>

        <v-card-actions>
            <v-btn
                text
                @click="close"
            >
                {{ $t('Common.Form.Cancel') }}
            </v-btn>

            <v-spacer />

            <v-btn
                :disabled="loading || !valid"
                color="success"
                text
                @click="save"
            >
                {{ $t('Common.Form.Save') }}
            </v-btn>
        </v-card-actions>
    </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { ApiException } from '@/types/api'
import { getTranslations } from '@/api/translations'
import { clone, findCommon, shallowDiff } from '@/utils/object-utils'
import { Translation } from '@/types/translation'
import TranslationForm from '@/components/media/TranslationForm.vue'
import { updateMultipleTranslations } from '@/api/moderation'
import { iziToastSuccess } from '@/plugins/izitoast'

@Component({
    components: { TranslationForm, ErrorAlert }
})
export default class MultipleTranslationEditDialog extends Vue {
    @Prop({ default: null }) translationIds!: number[] | null
    @Prop({ default: null }) translations!: Translation[] | null

    error: ApiException | null = null
    loading = false
    valid = false

    original: Partial<Translation> | null = null
    editable: Partial<Translation> | null = null

    get single (): boolean {
        return (this.translations ?? this.translationIds ?? []).length === 1
    }

    loadData (): void {
        if (this.translations) {
            let common = this.translations.reduce(findCommon, this.translations[0])
            this.original = common
            this.editable = clone(common)
        } else if (this.translationIds) {
            this.loading = true
            this.error = null

            getTranslations(this.translationIds).then((trs) => {
                if (!trs.length) return

                let common = trs.reduce(findCommon, trs[0])
                this.original = common
                this.editable = clone(common)
            }).catch((err) => {
                this.error = err
            }).finally(() => {
                this.loading = false
            })
        } else {
            throw new Error('Neither ids nor items passed.')
        }
    }

    save (): void {
        if (!this.original || !this.editable) return;
        (this.$refs.form as any).applyPendingChanges()

        this.loading = true
        this.error = null

        let ids: number[]
        if (this.translationIds) ids = this.translationIds
        else if (this.translations) ids = this.translations.map(i => i.id)
        else throw new Error('Neither ids nor items passed')

        updateMultipleTranslations(ids, shallowDiff(this.original, this.editable, ['', null]))
            .then(() => {
                iziToastSuccess(this.$t('Common.Form.ChangesSaved'))
                this.$emit('update')
                this.close()
            })
            .catch((err) => {
                this.error = err
            })
            .finally(() => {
                this.loading = false
            })
    }

    close (): void {
        this.$emit('close')
    }

    mounted (): void {
        this.loadData()
    }
}
</script>

<style>

</style>
