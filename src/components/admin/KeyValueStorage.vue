<template>
    <div>
        <v-text-field
            v-model="searchInput"
            append-icon="mdi-magnify"
            :label="$t('Pages.Search.Name')"
            hide-details
        />
        <div v-if="parser">
            <a @click="searchInput = ''">&lt;all&gt;</a>
            <span
                v-for="it in parser.storage"
                :key="it"
            >
                /&nbsp;<a
                    @click="searchInput = it"
                    v-text="it"
                />
            </span>
        </div>

        <v-data-table
            item-key="key"
            :footer-props="{ itemsPerPageOptions: [15, 25, 50], class: 'flex-nowrap' }"
            :headers="headers"
            :items="items"
            :loading="loading"
            :mobile-breakpoint="0"
            :no-data-text="$t('Common.Collection.NoItemsFound')"
            :options.sync="options"
            :server-items-length="count"
            class="overflow-auto"
            multi-sort
        >
            <template #item._actions="{ item }">
                <PopupTextInput
                    #default="{ on }"
                    :default="item.value"
                    :width="480"
                    label="Value"
                    @send="edit(item.key, $event)"
                >
                    <v-btn
                        icon
                        v-on="on"
                    >
                        <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                </PopupTextInput>
                <v-btn
                    icon
                    @click="remove(item.key)"
                >
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
            </template>
            <template #item.value="{ value }">
                <span class="text--monospace">{{ value }}</span>
            </template>
        </v-data-table>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { KeyValue, Parser } from '@/types/misc'
import { Debounced } from '@/utils/function-utils'
import { deleteFromKeyValueStorage, getKeyValueStorage, updateKeyValueStorage } from '@/api/admin'
import { convertDataTableOptionsToPagination } from '@/utils/helpers'
import { iziToastError, iziToastSuccess } from '@/plugins/izitoast'
import PopupTextInput from '@/components/misc/PopupTextInput.vue'

@Component({
    components: { PopupTextInput },
})
export default class KeyValueStorage extends Vue {
    @Prop({ default: null }) parser!: Parser | null

    loading = false
    items: KeyValue[] = []
    options: any = {}
    count = 0

    searchInput = ''

    headers = Object.freeze([
        {
            text: 'Actions',
            value: '_actions',
            sortable: false,
        },
        {
            text: 'Key',
            value: 'key',
        },
        {
            text: 'Value',
            value: 'value'
        },
    ])

    edit (key: string, value: string) {
        try {
            value = JSON.parse(value)
        } catch (e) {
            iziToastError('Invalid JSON')
            return
        }
        this.loading = true
        updateKeyValueStorage(key, value)
            .then(() => {
                iziToastSuccess()
                this.update()
            })
            .catch(iziToastError)
            .finally(() => {
                this.loading = false
            })
    }

    remove (key: string) {
        this.loading = true
        deleteFromKeyValueStorage(key)
            .then(() => {
                iziToastSuccess()
                this.update()
            })
            .catch(iziToastError)
            .finally(() => {
                this.loading = false
            })
    }

    @Watch('options')
    @Watch('parser')
    update (): void {
        this.loading = true
        getKeyValueStorage(convertDataTableOptionsToPagination(this.options, true), this.searchInput, this.parser?.uid).then((res) => {
            this.items = res.items
            this.count = res.count
        }).catch(iziToastError).finally(() => {
            this.loading = false
        })

    }

    @Watch('searchInput')
    @Debounced(500)
    doSearch (): void {
        this.options.page = 1
        this.update()
    }
}
</script>

<style>

</style>
