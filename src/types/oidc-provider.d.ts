declare module "oidc-provider" {
    class Provider {
        constructor(issuer: string, configuration?: any);
        [key: string]: any;
    }

    export default Provider;
    export { Provider };

    export const errors: any;

    export type Configuration = any;
    export type KoaContextWithOIDC = any;
    export type Interaction = any;
}
