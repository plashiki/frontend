<template>
    <UserPopup
        #default="{ on, user }"
        :control="control"
        :full="full"
        :user="user"
    >
        <v-chip
            v-if="user != null"
            :class="chipClass"
            pill
            v-bind="$attrs"
            v-on="{ ...$listeners, ...on }"
        >
            <v-avatar left>
                <v-img :src="user.avatar || defaultAvatar" />
            </v-avatar>
            <span
                class="user-chip-nickname text-truncate"
                v-text="user.nickname"
            />
        </v-chip>
    </UserPopup>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { User } from '@/types/user'
import UserPopup from '@/components/user/UserPopup.vue'
import { defaultAvatar } from '@/config'

@Component({
    components: { UserPopup }
})
export default class UserChip extends Vue {
    @Prop({ required: true }) user!: User
    @Prop({ type: Boolean, default: false }) full!: boolean
    @Prop({ type: Boolean, default: false }) control!: boolean
    @Prop({ type: String, default: '' }) chipClass!: string

    defaultAvatar = defaultAvatar
}
</script>

<style>
.user-chip-nickname {
    max-width: 96px;
}
</style>
