export const EXIT = {
  OK: 0,
  NOT_FOUND: 1,
  USAGE: 2,
  NETWORK: 3,
  SERVICE: 4,
  UNEXPECTED: 5,
};

export class IkirereError extends Error {
  constructor(message, exitCode = EXIT.UNEXPECTED) {
    super(message);
    this.name = "IkirereError";
    this.exitCode = exitCode;
  }
}