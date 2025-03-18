import time
import uuid
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from logging_config import logger
import redis
from config import settings

# Redis client for rate limiting
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    password=settings.REDIS_PASSWORD,
    decode_responses=True
)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        start_time = time.time()

        # Add request_id to request state
        request.state.request_id = request_id

        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "client_host": request.client.host if request.client else None,
            }
        )

        try:
            response = await call_next(request)

            # Log response
            process_time = time.time() - start_time
            logger.info(
                f"Request completed: {request.method} {request.url.path} - {response.status_code}",
                extra={
                    "request_id": request_id,
                    "status_code": response.status_code,
                    "process_time_ms": round(process_time * 1000, 2),
                }
            )

            return response
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                extra={
                    "request_id": request_id,
                    "process_time_ms": round(process_time * 1000, 2),
                    "error": str(e),
                }
            )
            raise


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for certain paths
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)

        # Get client IP
        client_ip = request.client.host if request.client else "unknown"

        # Get rate limit key
        rate_limit_key = f"rate_limit:{client_ip}:{request.url.path}"

        # Check if rate limited
        try:
            # Increment counter
            current = redis_client.incr(rate_limit_key)

            # Set expiry if first request
            if current == 1:
                redis_client.expire(rate_limit_key, 60)  # 60 seconds window

            # Check if rate limited
            if current > 100:  # 100 requests per minute
                logger.warning(f"Rate limit exceeded for {client_ip} on {request.url.path}")
                raise HTTPException(status_code=429, detail="Too many requests")

            # Add rate limit headers
            response = await call_next(request)
            response.headers["X-RateLimit-Limit"] = "100"
            response.headers["X-RateLimit-Remaining"] = str(100 - current)
            response.headers["X-RateLimit-Reset"] = str(redis_client.ttl(rate_limit_key))

            return response
        except redis.RedisError:
            # If Redis is unavailable, continue without rate limiting
            logger.error("Redis error in rate limiting")
            return await call_next(request)

