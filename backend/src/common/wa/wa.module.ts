import { Global, Module } from '@nestjs/common';
import { WaService } from './wa.service';

@Global()
@Module({
  providers: [WaService],
  exports: [WaService],
})
export class WaModule {}
