import { Module, Mutation } from 'vuex-module-decorators'
import { StaticModuleOptions } from 'vuex-module-decorators/dist/types/moduleoptions'

// here is all sugar stuff so we do less boilerplate in vuex modules

export const sharedMutations: string[] = []
export const localModules: string[] = []
export const localMutations: string[] = []

export function SharedMutation () {
    return function <T extends Record<string, any>, R> (target: Record<string, any>, key: string | symbol, descriptor: TypedPropertyDescriptor<(...args: any[]) => R>): void {
        Mutation(target, key, descriptor)
        const constructor = target.constructor as any
        if (!constructor._sharedMutations) {
            constructor._sharedMutations = []
        }
        constructor._sharedMutations.push(key)
    }
}

export function LocalMutation () {
    return function <T extends Record<string, any>, R> (target: Record<string, any>, key: string | symbol, descriptor: TypedPropertyDescriptor<(...args: any[]) => R>): void {
        Mutation(target, key, descriptor)
        const constructor = target.constructor as any
        if (!constructor._localMutations) {
            constructor._localMutations = []
        }
        constructor._localMutations.push(key)
    }
}

export function LocalSharedMutation () {
    return function <T extends Record<string, any>, R> (target: Record<string, any>, key: string | symbol, descriptor: TypedPropertyDescriptor<(...args: any[]) => R>): void {
        Mutation(target, key, descriptor)
        const constructor = target.constructor as any
        if (!constructor._localMutations) {
            constructor._localMutations = []
        }
        constructor._localMutations.push(key)
        if (!constructor._sharedMutations) {
            constructor._sharedMutations = []
        }
        constructor._sharedMutations.push(key)
    }
}

export interface VModuleOptions extends StaticModuleOptions {
    local?: boolean
}

export function VModule (options: VModuleOptions | string): ClassDecorator {
    return function (constructor: any): void {
        if (typeof options === 'string') {
            options = {
                name: options
            }
        }

        if (!options.name) throw new Error('name is not provided!')

        const modName = options.name!

        if (constructor._sharedMutations) {
            sharedMutations.push(...constructor._sharedMutations.map((i: string) => modName + '/' + i))
        }
        constructor._sharedMutations = undefined

        if (constructor._localMutations) {
            localMutations.push(...constructor._localMutations.map((i: string) => modName + '/' + i))
        }
        constructor._localMutations = undefined

        if (options.local) {
            localModules.push(modName)
        }

        return Module({
            ...options,
            stateFactory: true,
            namespaced: true
        })(constructor)
    }
}

export function VLocalModule (options: StaticModuleOptions | string = {}): ClassDecorator {
    return VModule(typeof options === 'string' ? {
        local: true,
        name: options
    } : {
        ...options,
        local: true
    })
}
