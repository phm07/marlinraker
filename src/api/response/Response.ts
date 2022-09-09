abstract class Response {
    public toString(): string {
        return JSON.stringify(this);
    }
}

export default Response;