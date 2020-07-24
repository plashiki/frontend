import fb from 'firebase/app'
import 'firebase/messaging'
import { firebaseConfig } from '@/config'

export const firebase = fb
export const firebaseApp = fb.apps[0] ?? fb.initializeApp(firebaseConfig)
export const firebaseMessaging = fb.messaging.isSupported() ? fb.messaging() : null
