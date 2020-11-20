<template>
    <div class="cards-page-container">
        <v-dialog
            v-model="editMultipleDialog"
            max-width="800"
        >
            <MultipleTranslationEditDialog
                v-if="editMultipleDialog"
                :translations="selected"
                @close="editMultipleDialog = false"
                @update="this.$refs.table.update"
            />
        </v-dialog>

        <v-simple-card>
            <div class="d-flex flex-row justify-center align-center flex-wrap">
                <v-text-field
                    v-model="group"
                    :disabled="groupDeleting"
                    hint="Leave blank to display all translations"
                    label="Group"
                    persistent-hint
                />
                <v-btn
                    class="ml-2"
                    color="primary"
                    outlined
                    rounded
                    @click="$refs.table.update()"
                >
                    {{ $t('Common.Load') }}
                </v-btn>

                <v-btn
                    :disabled="group.length === 0"
                    :loading="groupDeleting"
                    class="ma-1"
                    icon
                    @click="deleteGroup"
                >
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
            </div>
        </v-simple-card>

        <v-simple-card class="mt-2">
            <div class="d-flex flex-row">
                <v-menu>
                    <template #activator="{ on }">
                        <v-badge
                            :color="dark ? 'grey darken-3' : 'grey'"
                            :content="selected.length"
                            :offset-x="24"
                            :value="selected.length > 0"
                            bottom
                            class="small-badge"
                            overlap
                            right
                        >
                            <v-btn
                                icon
                                v-on="on"
                            >
                                <v-icon>mdi-dots-vertical</v-icon>
                            </v-btn>
                        </v-badge>
                    </template>

                    <v-list dense>
                        <VListItemIconText
                            :title="$t('Common.Collection.Deselect')"
                            icon="mdi-select-group"
                            @click="selected = []"
                        />

                        <v-subheader
                            disabled
                            v-text="$t('Common.Collection.WithSelected')"
                        />

                        <VListItemIconText
                            :disabled="selected.length === 0"
                            :title="$t('Common.Form.Edit')"
                            icon="mdi-pencil"
                            @click="editMultiple"
                        />

                        <VListItemIconText
                            :disabled="selected.length === 0"
                            :title="$t('Common.Form.Delete')"
                            icon="mdi-delete"
                            @click="deleteMultiple"
                        />
                    </v-list>
                </v-menu>
            </div>

            <TranslationsTable
                ref="table"
                v-model="selected"
                :group="group"
                :medias="medias"
                admin
            />
        </v-simple-card>
    </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import VSimpleCard from '@/components/common/VSimpleCard.vue'
import TranslationsTable from '@/components/moderation/TranslationsTable.vue'
import VListItemIconText from '@/components/common/VListItemIconText.vue'
import { appStore, configStore } from '@/store'
import { deleteMultipleTranslations, deleteTranslationsInGroup } from '@/api/moderation'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'
import { Translation } from '@/types/translation'
import MultipleTranslationEditDialog from '@/components/moderation/MultipleTranslationEditDialog.vue'

@Component({
    components: { MultipleTranslationEditDialog, VListItemIconText, TranslationsTable, VSimpleCard }
})
export default class AdminTranslationsPage extends Vue {
    group = ''
    medias = {}
    selected: Translation[] = []

    editMultipleDialog = false

    groupDeleting = false

    get dark (): boolean {
        return configStore.dark
    }

    deleteGroup (): void {
        this.groupDeleting = true

        deleteTranslationsInGroup(this.group)
            .then((res) => iziToastSuccess(this.$t('Common.Action.Deleted') + ': ' + res.affected))
            .catch(iziToastError)
            .finally(() => {
                this.groupDeleting = false
            })
    }

    editMultiple (): void {
        this.editMultipleDialog = true
    }

    deleteMultiple (): void {
        let ids = this.selected.map(i => i.id)
        this.selected = []
        deleteMultipleTranslations(ids).then(() => {
            iziToastSuccess(this.$t('Common.Action.Deleted'))
            ;(this.$refs.table as any).update()
        }).catch(iziToastError)
    }

    mounted (): void {
        appStore.merge({
            pageTitle: this.$t('Pages.AdminTranslations.Name')
        })
    }
}
</script>

<style>

</style>
