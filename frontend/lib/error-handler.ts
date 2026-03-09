export class ApiErrorHandler {
  static handleError(error: unknown): string {
    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch')) {
        return 'Unable to connect to the server. Please check your internet connection.';
      }
      return 'Network error. Please try again.';
    }

    if (error instanceof Error) {
      // Handle specific error messages from API
      if (error.message.includes('Unauthorized')) {
        return 'Your session has expired. Please log in again.';
      }
      if (error.message.includes('Forbidden')) {
        return 'You do not have permission to perform this action.';
      }
      if (error.message.includes('Not Found')) {
        return 'The requested resource was not found.';
      }
      if (error.message.includes('Conflict')) {
        return 'This resource already exists.';
      }
      if (error.message.includes('Invalid')) {
        return 'The information you provided is invalid.';
      }
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  static isNetworkError(error: unknown): boolean {
    return error instanceof TypeError && error.message.includes('Failed to fetch');
  }

  static isAuthError(error: unknown): boolean {
    return error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('401'));
  }
}
