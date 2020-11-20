<template>
    <div class="cards-page-container">
        <v-row class="no-gutters">
            <v-col class="d-flex flex-column">
                <v-simple-card class="fill-height page-card">
                    <div>
                        <v-text-field
                            v-model="searchInput"
                            :label="$t('Pages.Search.Name')"
                            :loading="userLoading"
                            :readonly="userLoading"
                        />
                        Find by:
                        <a
                            href="#"
                            @click="search('id')"
                            v-text="$t('Items.User.ID')"
                        />,
                        <a
                            href="#"
                            @click="search('shikiId')"
                            v-text="$t('Services.Shikimori')"
                        />,
                        <a
                            href="#"
                            @click="search('nickname')"
                            v-text="$t('Items.User.Nickname')"
                        />
                    </div>
                    <UserChip
                        v-if="foundUser"
                        :user="foundUser"
                        control
                        full
                    />
                </v-simple-card>
            </v-col>
            <v-col class="d-flex flex-column">
                <v-simple-card class="fill-height page-card">
                    <BudgetControl />
                </v-simple-card>
            </v-col>
        </v-row>

        <v-simple-card class="mt-2 page-card">
            <UsersTable />
        </v-simple-card>
    </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { appStore } from '@/store'
import VSimpleCard from '@/components/common/VSimpleCard.vue'
import UsersTable from '@/components/user/UsersTable.vue'
import UserChip from '@/components/user/UserChip.vue'
import { User } from '@/types/user'
import { getUser, getUserBy } from '@/api/user'
import { iziToastError } from '@/plugins/izitoast'
import BudgetControl from '@/components/admin/BudgetControl.vue'

@Component({
    components: { BudgetControl, UserChip, UsersTable, VSimpleCard }
})
export default class UsersAdminPage extends Vue {
    searchInput = ''
    foundUser: User | null = null
    userLoading = false

    @Watch('searchInput')
    searchInputChanged (val: string): void {
        if (val === '') {
            this.foundUser = null
        }
    }

    search (field: string): void {
        let prom: Promise<User | null>
        if (field === 'id') {
            prom = getUser(parseInt(this.searchInput))
        } else {
            prom = getUserBy(field, this.searchInput)
        }

        this.userLoading = true
        prom
            .then((user) => {
                this.foundUser = user
            })
            .catch(iziToastError)
            .finally(() => {
                this.userLoading = false
            })

    }

    mounted (): void {
        appStore.merge({
            pageTitle: this.$t('Pages.UsersAdmin.Name')
        })
    }
}
</script>

<style>

</style>
