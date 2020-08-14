import { DataProviderName } from '@/api/providers'

export const isProduction = process.env.NODE_ENV! === 'production'
export const currentCommit = process.env.COMMIT!
export const buildDate = process.env.BUILD_DATE!
export const version = process.env.VERSION!

export const mainDomain = process.env.VUE_APP_MAIN_DOMAIN!
export const appName = process.env.VUE_APP_APP_NAME!
export const defaultAvatar = process.env.VUE_APP_DEFAULT_AVATAR!
export const fallbackImage = process.env.VUE_APP_IMAGE_FALLBACK!
export const apiEndpoint = process.env.VUE_APP_API_ENDPOINT!

export const experimentalWSApi = true
export const storedNotificationsLimit = 100

export const shikimori = {
    authUrl: process.env.VUE_APP_SHIKIMORI_AUTH_URL! as string,
    clientId: process.env.VUE_APP_SHIKIMORI_CLIENT_ID! as string,
    endpoint: process.env.VUE_APP_SHIKIMORI_API_ENDPOINT! as string
}

export const firebaseConfig = JSON.parse(process.env.VUE_APP_FIREBASE_CONFIG!)
export const imgurClientId = process.env.VUE_APP_IMGUR_CLIENT_ID!
export const recaptchaSiteKey = process.env.VUE_APP_RECAPTCHA_SITE_KEY!
export const defaultProvider: DataProviderName = 'shikimori'
