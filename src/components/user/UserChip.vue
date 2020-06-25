<template>
    <UserPopup
        :control="control"
        :full="full"
        :user="user"
    >
        <template #default="{ on }">
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
                {{ user.nickname }}
            </v-chip>
        </template>
    </UserPopup>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { User } from '@/types/user'
import UserPopup from '@/components/user/UserPopup.vue'

@Component({
    components: { UserPopup }
})
export default class UserChip extends Vue {
    @Prop({ required: true }) user!: User
    @Prop({ type: Boolean, default: false }) full!: boolean
    @Prop({ type: Boolean, default: false }) control!: boolean
    @Prop({ type: String, default: '' }) chipClass!: string
}
</script>
