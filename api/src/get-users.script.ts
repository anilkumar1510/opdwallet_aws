import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';

async function getUserData() {
  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    console.log('📊 Getting complete user data...');

    // Get first 2 users with full data
    const users = await usersService.findAll({ page: '1', limit: '2' });

    console.log('\n=== Complete User Data (2 records) ===');
    console.log(JSON.stringify(users.data, null, 2));

    await app.close();
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error));
  }
}

getUserData();