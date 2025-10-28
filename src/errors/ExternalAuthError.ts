export class ExternalAuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ExternalAuthError';
    }
}
