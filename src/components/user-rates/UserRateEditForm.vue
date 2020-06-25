<template>
    <v-simple-card>
        <ErrorAlert :error="error" />

        <v-form v-model="valid">
            <!-- c-p from translationform coz im lazy. -->
            <v-number-field
                v-model="parts"
                :disabled="loading"
                :label="userRate.target_type === 'anime' ? $t('Items.UserRate.Episodes') : $t('Items.UserRate.Chapters')"
                :messages="parts && media && media.partsCount !== 0 && parts > media.partsCount ?
                    $tc(userRate.target_type === 'anime' ? 'Items.Media.OnlyNEpisodes'
                        : 'Items.Media.OnlyNChapters', media.partsCount) : undefined"
                :predicate="v => v >= 0"
                :prefix="$t('Items.Media.PartPrefix')"
            />

            <v-number-field
                v-if="userRate.target_type === 'manga'"
                v-model="partsVolumes"
                :disabled="loading"
                :label="$t('Items.UserRate.Volumes')"
                :predicate="v => v >= 0"
                :prefix="$t('Items.Media.PartPrefix')"
            />

            <v-select
                v-model="status"
                :disabled="loading"
                :items="statuses"
                :label="$t('Items.UserRate.Status')"
            >
                <template #item="{ item, on, attrs }">
                    <v-list-item
                        dense
                        v-bind="attrs"
                        v-on="on"
                    >
                        <v-list-item-avatar size="24">
                            <v-icon>
                                {{ item.icon }}
                            </v-icon>
                        </v-list-item-avatar>
                        <v-list-item-title>
                            {{ item.text }}
                        </v-list-item-title>
                    </v-list-item>
                </template>
            </v-select>
            <v-number-field
                v-model="repeats"
                :disabled="loading"
                :label="$t('Items.UserRate.Repeats')"
                :predicate="k => k >= 0"
            />
            <p class="ma-0 caption">
                {{ $t('Items.UserRate.Score') }}
            </p>
            <v-row
                align="center"
                justify="center"
            >
                <v-rating
                    v-model="proxyScore"
                    :color="loading ? 'primary lighten-3' : 'primary'"
                    :readonly="loading"
                    class="rating-smaller-gap"
                    half-icon="mdi-star-half-full"
                    half-increments
                    hover
                />
                <v-btn
                    v-tooltip="$t('Items.UserRate.ResetScore')"
                    :disabled="loading"
                    class="ml-2"
                    icon
                    small
                    @click="proxyScore = 0"
                >
                    <v-icon small>
                        mdi-block-helper
                    </v-icon>
                </v-btn>
            </v-row>

            <v-row class="mt-3 px-2">
                <v-btn
                    :disabled="!valid || loading"
                    color="success"
                    rounded
                    small
                    text
                    @click="save"
                >
                    {{ $t('Common.Form.Save') }}
                </v-btn>
                <v-spacer />
                <v-btn
                    v-tooltip="$t('Common.Form.Delete')"
                    :disabled="loading"
                    icon
                    small
                    @click="del"
                >
                    <v-icon small>
                        mdi-delete
                    </v-icon>
                </v-btn>
            </v-row>
        </v-form>

        <v-progress-linear
            v-if="loading"
            absolute
            bottom
            indeterminate
        />
    </v-simple-card>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { deleteUserRate, updateUserRate } from '@/api/user-rates'
import { merge } from '@/utils/object-utils'
import VNumberField from '@/components/common/fields/VNumberField.vue'
import { Media } from '@/types/media'
import { UserRate, UserRateStatus } from '@/types/user-rate'
import { ApiException } from '@/types/api'
import VSimpleCard from '@/components/common/VSimpleCard.vue'

const statusIconsMap: Record<UserRateStatus, string> = {
    [UserRateStatus.Planned]: 'mdi-calendar-text',
    [UserRateStatus.InProgress]: 'mdi-play-circle-outline',
    [UserRateStatus.Completed]: 'mdi-check',
    [UserRateStatus.Dropped]: 'mdi-close',
    [UserRateStatus.OnHold]: 'mdi-clock-outline'
}

@Component({
    components: { VSimpleCard, VNumberField, ErrorAlert }
})
export default class UserRateEditForm extends Vue {
    @PropSync('rate', { required: true }) userRate!: UserRate
    @Prop() media!: Media | null
    @Prop({ default: true }) visible!: boolean

    error: ApiException | null = null

    valid = false
    loading = false

    parts = 0
    partsVolumes = 0
    status: UserRateStatus = UserRateStatus.Planned
    score: number | null = null
    repeats = 0

    get proxyScore (): number {
        return (this.score ?? 0) / 2
    }

    set proxyScore (val: number) {
        this.score = val === 0 ? null : val * 2
    }

    get statuses (): any[] {
        return Object.values(UserRateStatus).map(it => ({
            value: it,
            text: this.$t(`Items.UserRate.StatusText.${it}`),
            icon: statusIconsMap[it]
        }))
    }

    save (): void {
        this.loading = true
        let params: Partial<UserRate> = {
            target_type: this.userRate.target_type,
            parts: this.parts,
            status: this.status,
            score: this.score,
            repeats: this.repeats
        }

        if (this.userRate.target_type === 'manga') {
            params.partsVolumes = this.partsVolumes
        }

        updateUserRate(this.userRate.id, params).then((rate) => {
            merge(this.userRate, rate)
            this.loading = false
            this.$emit('close')
        }).catch((err) => {
            this.loading = false
            this.error = err
        })
    }

    del (): void {
        this.loading = true
        deleteUserRate(this.userRate.id).then(() => {
            this.loading = false
            this.$emit('rate-update', null)
            this.$emit('close')
        }).catch((err) => {
            this.loading = false
            this.error = err
        })
    }

    @Watch('rate')
    updateFields (val: UserRate | null): void {
        if (val) {
            this.parts = this.userRate.parts
            this.status = this.userRate.status
            this.score = this.userRate.score
            this.repeats = this.userRate.repeats
        } else {
            this.parts = 0
            this.status = UserRateStatus.Planned
            this.score = 0
            this.repeats = 0
        }
    }

    @Watch('visible')
    visibilityChanged (val: boolean): void {
        if (val) {
            // reset prev user input.
            this.updateFields(this.userRate)
        }
    }

    mounted (): void {
        this.updateFields(this.userRate)
    }
}
</script>

<style>

</style>
