import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeliveryType } from '@prisma/client';
import { EstimateShippingDto } from './dto/checkout.dto';

interface DistanceResponse {
  status: string;
  rows?: Array<{
    elements?: Array<{ status: string; distance?: { value: number } }>;
  }>;
}

@Injectable()
export class ShippingService {
  constructor(private readonly config: ConfigService) {}

  async estimate(dto: EstimateShippingDto) {
    if (dto.deliveryType === DeliveryType.PICKUP)
      return { distanceKm: 0, fee: 0 };
    if (!dto.address)
      throw new BadRequestException('Address is required for delivery');
    const key = this.config.getOrThrow<string>('GOOGLE_MAPS_API_KEY');
    if (key.startsWith('your_'))
      throw new BadGatewayException(
        'Shipping distance provider is not configured',
      );
    const origin = `${this.config.getOrThrow('TOKO_ORIGIN_LAT')},${this.config.getOrThrow('TOKO_ORIGIN_LNG')}`;
    const destination = `${dto.address.latitude},${dto.address.longitude}`;
    const url = new URL(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
    );
    url.searchParams.set('origins', origin);
    url.searchParams.set('destinations', destination);
    url.searchParams.set('key', key);
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok)
      throw new BadGatewayException('Shipping distance provider failed');
    const body = (await response.json()) as DistanceResponse;
    const element = body.rows?.[0]?.elements?.[0];
    if (body.status !== 'OK' || element?.status !== 'OK' || !element.distance) {
      throw new BadRequestException('Delivery address is not reachable');
    }
    const distanceKm = element.distance.value / 1000;
    const baseKm = this.config.get<number>('ONGKIR_BASE_KM', 4);
    const baseFee = this.config.get<number>('ONGKIR_BASE_FEE', 10000);
    const perKm = this.config.get<number>('ONGKIR_PER_KM_FEE', 2500);
    const fee = baseFee + Math.max(0, Math.ceil(distanceKm - baseKm)) * perKm;
    return { distanceKm: Number(distanceKm.toFixed(2)), fee };
  }
}
