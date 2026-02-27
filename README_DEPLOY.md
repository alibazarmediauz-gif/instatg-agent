# InstaTG Agent - Production Deployment Guide 🚀

This guide outlines how to deploy and maintain the InstaTG Agent platform in a production environment (optimized for Uzbekistan/SNG).

## 1. Prerequisites
- Docker & Docker Compose
- A server with at least 4GB RAM
- Domain name with SSL certificates
- Credentials for: Anthropic (Claude), Meta (App/Verify Tokens), and Payment Gateways (Payme/Click).

## 2. Fast Launch
```bash
# Clone and enter the project
cd InstaTG-Agent

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your production keys (SENTRY_DSN, APP_ENV=production, etc.)

# Start the entire stack
docker-compose up -d --build
```

## 3. Database Management 🗄️
The platform uses **Alembic** for migrations.
- **Initial Setup**: Run `docker-compose exec backend alembic upgrade head` to apply all migrations.
- **Backups**: Run `./scripts/backup.sh` daily via crontab.
  ```bash
  # Example crontab (daily at 3 AM)
  0 3 * * * /path/to/project/scripts/backup.sh
  ```

## 4. Maintenance & Monitoring 📊
- **Logs**: In production (`APP_ENV=production`), logs are output in JSON format to `stdout`. Use `docker-compose logs -f backend` or a log forwarder.
- **Errors**: Check your **Sentry** dashboard for real-time exception tracking.
- **Worker Health**: Monitor the `http://your-domain.uz/health` endpoint. If `celery: "timeout"`, check the `worker` container.

## 5. Security Checklist 🛡️
- Ensure `SECRET_KEY` is changed from default.
- Use Nginx (included) as the reverse proxy for SSL termination.
- Rotate Payment Gateway tokens periodically.

---
**InstaTG Agent - Built for Uzbekistan's AI Sales Revolution.**
