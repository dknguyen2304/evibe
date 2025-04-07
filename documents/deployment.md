# Deployment Documentation for EVibe Movie Streaming Platform

This document provides comprehensive instructions for deploying the RoPhim movie streaming platform clone.

## System Requirements

- Node.js 18.x or higher
- PostgreSQL 14.x or higher
- Redis 6.x or higher
- Docker and Docker Compose (optional, for containerized deployment)

## Environment Setup

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/rophim
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=rophim
DATABASE_USER=username
DATABASE_PASSWORD=password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redispassword
REDIS_DB=0
REDIS_TLS=false

# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# Application Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Replace the placeholder values with your actual configuration.

## Deployment Options

### Option 1: Local Development Deployment

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up the database:

   ```bash
   npm run db:setup
   ```

3. Build the application:

   ```bash
   npm run build
   ```

4. Start the application:
   ```bash
   npm start
   ```

The application will be available at http://localhost:3000.

### Option 2: Docker Deployment

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```

The application will be available at http://localhost:3000.

### Option 3: Production Deployment with Vercel

1. Install the Vercel CLI:

   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:

   ```bash
   vercel login
   ```

3. Deploy to Vercel:

   ```bash
   vercel --prod
   ```

4. Set up environment variables in the Vercel dashboard.

## Database Setup

### Initial Setup

The application will automatically set up the database schema and seed initial data on first run. However, you can manually initialize the database:

```bash
npm run db:migrate
npm run db:seed
```

### Database Backup and Restore

To backup the database:

```bash
pg_dump -U username -d rophim > backup.sql
```

To restore from backup:

```bash
psql -U username -d rophim < backup.sql
```

## Redis Setup

### Redis Configuration

Ensure Redis is properly configured with password authentication:

```
requirepass redispassword
```

### Redis Persistence

For production, enable Redis persistence by adding the following to your `redis.conf`:

```
appendonly yes
appendfsync everysec
```

## Scaling Considerations

### Horizontal Scaling

The application is designed to scale horizontally. For high-traffic scenarios:

1. Deploy multiple application instances behind a load balancer
2. Use Redis for session storage and caching
3. Scale the database with read replicas

### Vertical Scaling

For moderate traffic, vertical scaling can be sufficient:

1. Increase resources (CPU/RAM) for the application server
2. Optimize database performance with proper indexing
3. Configure Redis with appropriate memory limits

## Monitoring and Maintenance

### Application Monitoring

1. Set up application monitoring using tools like New Relic or Datadog
2. Monitor API response times and error rates
3. Set up alerts for critical errors

### Database Monitoring

1. Monitor database performance metrics
2. Set up regular database maintenance tasks
3. Monitor disk space usage

### Redis Monitoring

1. Monitor Redis memory usage
2. Set up alerts for high memory usage
3. Monitor cache hit/miss rates

## Security Considerations

1. Ensure all environment variables are properly secured
2. Set up proper firewall rules to restrict access to database and Redis
3. Enable HTTPS for all traffic
4. Regularly update dependencies to patch security vulnerabilities
5. Implement rate limiting for API endpoints

## Troubleshooting

### Common Issues

1. **Database Connection Issues**

   - Check database credentials
   - Verify network connectivity
   - Check database server status

2. **Redis Connection Issues**

   - Verify Redis is running
   - Check Redis credentials
   - Verify network connectivity

3. **Application Startup Issues**
   - Check environment variables
   - Verify Node.js version
   - Check application logs for errors

## Backup Strategy

1. Set up daily database backups
2. Configure Redis persistence
3. Back up environment configuration
4. Store backups in a secure, off-site location

## Conclusion

Following these deployment instructions will ensure a smooth and successful deployment of the RoPhim movie streaming platform. For additional support or questions, please contact the development team.
