<template>
    <div>
        <ErrorAlert :error="error" />

        <div class="d-flex flex-row justify-end">
            <v-btn
                icon
                @click="update"
            >
                <v-icon>
                    mdi-refresh
                </v-icon>
            </v-btn>
        </div>
        <v-data-table
            :footer-props="{ itemsPerPageOptions: [15, 25, 50], class: 'flex-nowrap' }"
            :headers="headers"
            :items="items"
            :loading="loading"
            :mobile-breakpoint="0"
            :no-data-text="$t('Common.Collection.NoItemsFound')"
            :options.sync="options"
            :server-items-length="count"
            class="overflow-auto mt-3"
            multi-sort
        >
            <template #item.avatar="{ value }">
                <v-avatar size="32">
                    <img
                        :src="value"
                        alt=""
                    />
                </v-avatar>
            </template>
            <template #item.first_login_at="{ value }">
                {{ formatTime(value) }}
            </template>
            <template #item.admin="{ value }">
                <v-simple-checkbox
                    :value="value"
                    disabled
                />
            </template>
            <template #item.moderator="{ value }">
                <v-simple-checkbox
                    :value="value"
                    disabled
                />
            </template>
            <template #item.trusted="{ value }">
                <v-simple-checkbox
                    :value="value"
                    disabled
                />
            </template>
            <template #item.banned="{ value }">
                <v-simple-checkbox
                    :value="value"
                    disabled
                />
            </template>
            <template #item._control="{ item }">
                <UserPopup
                    #default="{ on }"
                    :user="item"
                    control
                    full
                >
                    <v-btn
                        icon
                        v-on="on"
                    >
                        <v-icon>mdi-dots-vertical</v-icon>
                    </v-btn>
                </UserPopup>
            </template>
        </v-data-table>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { convertDataTableOptionsToPagination } from '@/utils/helpers'
import { User } from '@/types/user'
import { ApiException } from '@/types/api'
import { getUsersList } from '@/api/admin'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { formatDistance } from 'date-fns'
import { dateFnLocale } from '@/plugins/vue-i18n'
import UserPopup from '@/components/user/UserPopup.vue'

@Component({
    components: { UserPopup, ErrorAlert }
})
export default class UsersTable extends Vue {
    options: any = {}
    count = 0

    items: User[] = []
    loading = false
    error: ApiException | null = null

    get headers (): any[] {
        return [
            {
                text: this.$t('Items.User.ID'),
                value: 'id',
                width: 100
            },
            {
                text: this.$t('Items.User.Avatar'),
                sortable: false,
                value: 'avatar',
                align: 'center'
            },
            {
                text: this.$t('Items.User.Nickname'),
                value: 'nickname',
                width: 200
            },
            {
                text: this.$t('Items.User.FirstLogin'),
                value: 'first_login_at',
                width: 150
            },
            {
                text: this.$t('Items.User.Donated'),
                value: 'donated',
                width: 170,
                align: 'center'
            },
            {
                text: this.$t('Items.User.Admin'),
                value: 'admin',
                width: 120,
                align: 'center'
            },
            {
                text: this.$t('Items.User.Moderator'),
                value: 'moderator',
                width: 140,
                align: 'center'
            },
            {
                text: this.$t('Items.User.Trusted'),
                value: 'trusted',
                width: 160,
                align: 'center'
            },
            {
                text: this.$t('Items.User.Banned'),
                value: 'banned',
                width: 120,
                align: 'center'
            },
            {
                text: '',
                value: '_control',
                sortable: false
            }
        ]
    }

    formatTime (time: string): string {
        if (time === '1970-01-01T00:00:00.000Z') return this.$t('Common.No')
        let date = new Date(time)
        return formatDistance(date, new Date(), {
            locale: dateFnLocale(),
            addSuffix: true
        })
    }

    @Watch('options', { deep: true })
    update (): Promise<void> {
        this.loading = true
        this.error = null

        return getUsersList(
            convertDataTableOptionsToPagination(this.options, true)
        ).then((data) => {
            this.items = data.items
            this.count = data.count
        }).catch((err) => {
            this.error = err
        }).finally(() => {
            this.loading = false
        })
    }
}
</script>

<style>

</style>
