import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'));
  
  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, 
      transformOptions: {
        enableImplicitConversion: true, 
      },
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = process.env.PORT ?? 3000;
  // Listen on 0.0.0.0 to accept connections from other machines on the network
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 QR Ticket Scanner API is running on:`);
  console.log(`   - http://localhost:${port} (same machine)`);
  console.log(`   - http://localhost:${port}/view-qr.html (QR Code Viewer)`);
  console.log(`   - Network access: http://YOUR_IP:${port}`);
  console.log(`   - CORS enabled for all origins (ready for Netlify frontend)`);
}
bootstrap();  
