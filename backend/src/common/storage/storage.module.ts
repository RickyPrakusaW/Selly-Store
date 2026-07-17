import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import {
  ProtectedFilesController,
  PublicFilesController,
} from './files.controller';

@Global()
@Module({
  controllers: [PublicFilesController, ProtectedFilesController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
