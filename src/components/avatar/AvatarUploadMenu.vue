<template>
    <v-menu
        v-model="visible"
        :close-on-click="fileUploading === -1"
        :close-on-content-click="false"
        v-bind="$attrs"
        v-on="$listeners"
    >
        <template #activator="{ on }">
            <slot :on="on" />
        </template>

        <v-card>
            <v-row
                align="center"
                class="flex-sm-nowrap"
                no-gutters
            >
                <v-col
                    class="text-center"
                    cols="12"
                    sm="4"
                >
                    <AvatarView
                        :src="currentSrc"
                        class="my-2 my-sm-0"
                        no-edit
                        size="96"
                        @error="imageLoadError"
                    />
                </v-col>
                <v-col
                    cols="12"
                    sm="8"
                >
                    <v-tabs
                        v-model="tab"
                        grow
                    >
                        <v-tab :disabled="fileUploading !== -1">
                            {{ $t('Pages.Image.ImgurTab') }}
                        </v-tab>
                        <v-tab :disabled="fileUploading !== -1">
                            {{ $t('Pages.Image.UrlTab') }}
                        </v-tab>
                    </v-tabs>
                    <v-divider />

                    <v-tabs-items v-model="tab">
                        <div class="px-2 pt-2">
                            <v-tab-item>
                                <ErrorAlert :error="uploadError" />
                                <v-file-input
                                    v-model="fileInput"
                                    :disabled="fileUploading !== -1"
                                    :label="$t('Common.Form.SelectFile')"
                                    :loading="fileUploading !== -1"
                                    :rules="[validateFile]"
                                    accept="image/jpeg,image/png,image/gif,image/tiff"
                                    class="small-input-text"
                                    validate-on-blur
                                >
                                    <template #progress>
                                        <v-progress-linear
                                            :active="fileUploading !== -1"
                                            :indeterminate="fileUploading === 0"
                                            :value="fileUploading"
                                            absolute
                                            height="2"
                                        />
                                    </template>
                                    <template #append-outer>
                                        <v-btn
                                            :disabled="!valid"
                                            icon
                                            small
                                            @click="startUpload"
                                        >
                                            <v-icon>
                                                mdi-upload
                                            </v-icon>
                                        </v-btn>
                                    </template>
                                </v-file-input>
                            </v-tab-item>
                            <v-tab-item>
                                <v-text-field
                                    v-model="urlInput"
                                    :label="$t('Pages.Image.UrlLabel')"
                                    :rules="[urlValidator]"
                                    class="small-input-text"
                                    @blur="urlLostFocus"
                                />
                            </v-tab-item>
                        </div>
                    </v-tabs-items>

                    <v-spacer />

                    <v-divider />
                    <v-row
                        class="ma-2 flex-sm-nowrap"
                        justify="end"
                        no-gutters
                    >
                        <v-btn
                            :disabled="fileUploading !== -1"
                            text
                            @click="visible = false"
                        >
                            {{ $t('Common.Form.Cancel') }}
                        </v-btn>
                        <v-btn
                            :disabled="fileUploading !== -1"
                            color="success"
                            text
                            @click="save"
                        >
                            {{ $t('Common.Form.Save') }}
                        </v-btn>
                    </v-row>
                </v-col>
            </v-row>
        </v-card>
    </v-menu>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import AvatarView from '@/components/avatar/AvatarView.vue'
import { urlValidator } from '@/utils/validators'
import ErrorAlert from '@/components/common/ErrorAlert.vue'
import { ApiException } from '@/types/api'
import { uploadToImgur } from '@/api/misc'
import { iziToastError } from '@/plugins/izitoast'

@Component({
    components: { ErrorAlert, AvatarView }
})
export default class ImageUploadMenu extends Vue {
    @Prop() src!: string | null

    urlInput = ''
    urlValidator = urlValidator

    fileInput: File | null = null
    // -1 = idle
    // 0 = indeterminate
    // 1-100 = progress (in %)
    fileUploading = -1
    uploadError: ApiException | null = null

    currentSrc: string | null = null

    visible = false
    tab = 0

    get valid (): boolean {
        if (this.tab === 0) {
            return this.fileInput !== null && this.validateFile(this.fileInput) === true
        } else {
            return true
        }
    }

    @Watch('src')
    srcChanged (val: string | null): void {
        this.currentSrc = val
        this.urlInput = val ?? ''
    }

    imageLoadError (err: Error | string): void {
        iziToastError(err, {
            title: this.$t('Pages.Image.LoadError')
        })
    }

    startUpload (): void {
        if (!this.fileInput) return

        this.uploadError = null
        this.fileUploading = 0
        uploadToImgur(this.fileInput, (progress) => {
            this.fileUploading = progress
        }).then((url) => {
            this.currentSrc = this.urlInput = url
        }).catch((err) => {
            this.uploadError = err
        }).finally(() => {
            this.fileUploading = -1
        })
    }

    validateFile (file: File): boolean | string {
        if (!file) return this.$t('Common.Form.ThisFieldIsRequired')
        if (!file.type.match(/^image\/(png|jpeg|tiff)$/)) {
            return this.$t('Common.Form.InvalidFile')
        }
        // 10 mb max (imgur limit)
        if (file.size > 10485760) {
            return this.$t('Common.Form.MaxFileSize', { size: '10 MB' })
        }

        return true
    }

    urlLostFocus (): void {
        let val = this.urlInput
        if (urlValidator(val) === true) {
            this.currentSrc = val || null
        }
    }

    save (): void {
        this.$emit('save', this.currentSrc)
        this.visible = false
    }

    mounted (): void {
        this.srcChanged(this.src)
    }
}
</script>

<style>

</style>
