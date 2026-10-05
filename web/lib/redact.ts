// Conservative masking: false-positive redaction is preferable to leaking identifiers.
export function redact(text:string):string{
 return text.normalize("NFKC")
 .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[EMAIL]")
 .replace(/\b0x[a-f0-9]{40,64}\b/gi,"[WALLET]")
 .replace(/\b[a-z0-9._-]+@[a-z][a-z0-9.-]*\b/gi,"[PAYEE]")
 .replace(/(?<!\d)(?:\d{4}[ -]?){2}\d{4}(?!\d)/g,"[ID_NUMBER]")
 .replace(/(?<!\d)\+?\d(?:[\d ()-]{6,30}\d)(?!\d)/g,"[NUMBER]")
 .replace(/\b\d{4,}\b/g,"[NUMBER]")
 .replace(/[०-९௦-௯]{4,}(?:[ -][०-९௦-௯]+)*/g,"[NUMBER]");
}
