import logging
import sys
import structlog
from app.config import settings

def setup_logging():
    """
    Configures structlog for structured JSON logging in production
    and human-readable console logging in development.
    """
    
    # Processors for structlog
    processors = [
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if settings.is_production:
        # Production: JSON output for ELK/Datadog/CloudWatch
        processors.append(structlog.processors.JSONRenderer())
    else:
        # Development: Pretty color output
        processors.append(structlog.dev.ConsoleRenderer())

    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configure standard logging to use structlog's output
    handler = logging.StreamHandler(sys.stdout)
    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO if settings.is_production else logging.DEBUG)
