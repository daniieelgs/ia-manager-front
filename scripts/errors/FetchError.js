
class FetchError extends Error {
  constructor(message, data, status) {
    super(message);
    this.name = 'FetchError';
    this.data = data;
    this.status = status;
  }
}