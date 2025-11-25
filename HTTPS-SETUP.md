# HTTPS Development Setup

This guide helps you fix the "Navigation failed because the request was for an HTTP URL with HTTPS-Only enabled" error.

## Quick Fix

Run these commands in your terminal:

```bash
# Setup HTTPS for development
npm run setup-dev

# Start the development server with HTTPS
npm run dev
```

Then visit: **https://localhost:3001** (note the `https://`)

## What This Does

1. **Generates self-signed SSL certificates** for localhost
2. **Configures Next.js** to use HTTPS in development
3. **Updates CORS headers** to allow HTTPS requests
4. **Creates environment variables** for HTTPS configuration

## Browser Certificate Warning

When you first visit `https://localhost:3001`, your browser will show a security warning because the certificate is self-signed. This is normal for development.

### How to Accept the Certificate:

**Chrome/Edge:**
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)"

**Firefox:**
1. Click "Advanced"
2. Click "Accept the Risk and Continue"

**Safari:**
1. Click "Show Details"
2. Click "visit this website"
3. Click "Visit Website"

## Alternative Solutions

If the HTTPS setup doesn't work, you can:

### Option 1: Disable HTTPS-Only Mode
1. In your browser settings, find "Security" or "Privacy"
2. Disable "HTTPS-Only Mode" or "Always use secure connections"
3. Use `npm run dev:http` to start with HTTP

### Option 2: Add Localhost Exception
1. In browser settings, add `localhost:3001` to HTTPS exceptions
2. Use `npm run dev:http` to start with HTTP

### Option 3: Use mkcert (Recommended for long-term)
```bash
# Install mkcert (requires admin/sudo)
# Windows (with Chocolatey):
choco install mkcert

# macOS (with Homebrew):
brew install mkcert

# Then generate trusted certificates:
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

## Troubleshooting

### "openssl not found" Error
- **Windows**: Install Git for Windows (includes OpenSSL) or install OpenSSL separately
- **macOS**: Install via Homebrew: `brew install openssl`
- **Linux**: Install via package manager: `sudo apt-get install openssl`

### Certificate Still Not Trusted
- Try using `mkcert` instead of self-signed certificates
- Clear browser cache and cookies for localhost
- Restart your browser after accepting the certificate

### CORS Errors
- Make sure you're using `https://localhost:3001` (not `http://`)
- Check that the Next.js server is running with HTTPS enabled
- Verify the CORS headers in `next.config.ts`

## Scripts Reference

- `npm run dev` - Start with HTTPS (default)
- `npm run dev:http` - Start with HTTP only
- `npm run setup-dev` - Setup HTTPS configuration and certificates
- `npm run setup-https` - Generate SSL certificates only

## Files Created

- `certs/localhost.pem` - SSL certificate
- `certs/localhost-key.pem` - SSL private key  
- `.env.local` - Environment variables for HTTPS
