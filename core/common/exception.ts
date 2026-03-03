export class ToolRetriableException extends Error {
    constructor(message: string, error?: Error) {
        super(message, error)
    }
}

export class ToolFatalException extends Error {
    constructor(message: string, error?: Error) {
        super(message, error)
    }
}