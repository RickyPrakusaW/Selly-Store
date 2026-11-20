import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getInfo: () => ({ service: 'seli-florist-api', status: 'ok' }),
            getHealth: () => ({ status: 'ok', database: 'connected' }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns service metadata', () => {
      expect(appController.getInfo()).toEqual({
        service: 'seli-florist-api',
        status: 'ok',
      });
    });
  });
});
