export function bootstrapMessage(): string {
  return "IdolBooth server scaffold ready";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(bootstrapMessage());
}
