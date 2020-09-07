export type ErrorType =
  | 'unknown'
  | 'record-not-found'
  | 'invalid-relationship'
  | 'invalid-filter'
  | 'invalid-sort'
  | 'invalid-pagination';

export class Error {
  type: ErrorType;
  message: string;

  constructor(type: ErrorType, message: string) {
    this.type = type;
    this.message = message;
  }
}
