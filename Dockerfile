# Use Deno 2.0.0 as base
FROM denoland/deno:2.0.0

# Set working directory inside container
WORKDIR /app

# Expose default Deno port
EXPOSE 8000

# Default command (can be overridden by docker run)
CMD ["deno", "run", "-A", "main.ts"]