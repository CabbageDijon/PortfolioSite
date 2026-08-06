# Use the lightweight, production-grade Nginx alpine image
FROM nginx:alpine

# Remove default Nginx configuration to prevent conflicts
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom Nginx configuration directly into the container
COPY nginx.conf /etc/nginx/conf.d/

# Copy everything inside your local public folder into Nginx's HTML directory
COPY public/ /usr/share/nginx/html/

# Pull demo sites from GitHub into /demos/<slug>/ (relative links work as-is).
# Falls back to the bundled local public/demos copy if the repo is unreachable.
RUN apk add --no-cache git \
 && if git clone --depth 1 https://github.com/CabbageDijon/KwenaWaterWorks.git /tmp/kwena; then \
      rm -rf /usr/share/nginx/html/demos/kwena \
      && mv /tmp/kwena/public /usr/share/nginx/html/demos/kwena; \
    else \
      echo "WARN: Kwena demo repo not reachable — using bundled local copy (if present)"; \
    fi \
 && rm -rf /tmp/kwena \
 && apk del git

# Expose port 80 to the Dokploy internal network
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]