# Use the lightweight, production-grade Nginx alpine image
FROM nginx:alpine

# Remove default Nginx configuration to prevent conflicts
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom Nginx configuration directly into the container
COPY nginx.conf /etc/nginx/conf.d/

# Copy everything inside your local public folder into Nginx's HTML directory
COPY public/ /usr/share/nginx/html/

# Expose port 80 to the Dokploy internal network
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]