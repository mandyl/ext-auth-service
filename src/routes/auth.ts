import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { validateAuthorization } from '../middleware/token-validator';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /auth
   *
   * Called by Higress ext-auth plugin to validate incoming requests.
   * Higress forwards the Authorization header (and X-Forwarded-* headers
   * in forward_auth mode) to this endpoint.
   *
   * Response codes:
   *   200 - authenticated; x-user-id header carries the resolved user ID
   *   401 - missing or malformed Authorization header
   *   403 - token is unknown
   */
  fastify.post('/auth', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers['authorization'] as string | undefined;

    const result = validateAuthorization(authHeader);

    if (result.valid && result.userId) {
      fastify.log.info({
        msg: 'auth success',
        userId: result.userId,
        forwardedHost: request.headers['x-forwarded-host'],
        forwardedUri: request.headers['x-forwarded-uri'],
        forwardedMethod: request.headers['x-forwarded-method'],
      });

      return reply
        .status(200)
        .header('x-user-id', result.userId)
        .header('x-auth-version', '1.0')
        .send();
    }

    // Auth failed
    const isFormatError = result.errorCode === 'missing_or_invalid_format';
    const statusCode = isFormatError ? 401 : 403;

    fastify.log.warn({
      msg: 'auth failed',
      errorCode: result.errorCode,
      forwardedHost: request.headers['x-forwarded-host'],
      forwardedUri: request.headers['x-forwarded-uri'],
    });

    const replyBuilder = reply
      .status(statusCode)
      .header('x-auth-error', result.errorCode ?? 'unknown');

    if (isFormatError) {
      replyBuilder.header('www-authenticate', 'Bearer realm="mcp-service"');
    }

    return replyBuilder.send();
  });
}
