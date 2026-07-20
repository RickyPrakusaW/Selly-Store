import { Module } from '@nestjs/common';
import { RentalController } from './rental.controller';

@Module({ controllers: [RentalController] })
export class RentalModule {}
