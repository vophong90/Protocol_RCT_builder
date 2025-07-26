# Use an official PHP runtime as a parent image
FROM php:8.1-cli

# Set working directory
WORKDIR /var/www/html

# Copy all project files
COPY . .

# Install Apache + PHP extensions if needed (optional, for CLI it's okay)

# Move tcmip.php into the right place (already in /public)

# Expose port (Render uses 10000 internally)
EXPOSE 10000

# Use PHP's built-in web server
CMD ["php", "-S", "0.0.0.0:10000", "-t", "public"]
