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
      throw new BadRequestException('Alamat wajib diisi untuk pengantaran');
    const originLat = this.config.getOrThrow<number>('TOKO_ORIGIN_LAT');
    const originLng = this.config.getOrThrow<number>('TOKO_ORIGIN_LNG');
    const key = this.config.getOrThrow<string>('GOOGLE_MAPS_API_KEY');
    if (key.startsWith('your_')) {
      const distanceKm = this.haversineDistance(
        originLat,
        originLng,
        Number(dto.address.latitude),
        Number(dto.address.longitude),
      );
      return this.calculateFee(distanceKm);
    }
    const origin = `${originLat},${originLng}`;
    const destination = `${dto.address.latitude},${dto.address.longitude}`;
    const url = new URL(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
    );
    url.searchParams.set('origins', origin);
    url.searchParams.set('destinations', destination);
    url.searchParams.set('key', key);
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok)
      throw new BadGatewayException(
        'Penyedia jarak pengiriman tidak merespons',
      );
    const body = (await response.json()) as DistanceResponse;
    const element = body.rows?.[0]?.elements?.[0];
    if (body.status !== 'OK' || element?.status !== 'OK' || !element.distance) {
      throw new BadRequestException('Alamat pengantaran tidak dapat dijangkau');
    }
    const distanceKm = element.distance.value / 1000;
    return this.calculateFee(distanceKm);
  }

  private calculateFee(distanceKm: number) {
    const baseKm = this.config.get<number>('ONGKIR_BASE_KM', 4);
    const baseFee = this.config.get<number>('ONGKIR_BASE_FEE', 10000);
    const perKm = this.config.get<number>('ONGKIR_PER_KM_FEE', 2500);
    const fee = baseFee + Math.max(0, Math.ceil(distanceKm - baseKm)) * perKm;
    return { distanceKm: Number(distanceKm.toFixed(2)), fee };
  }

  private haversineDistance(
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number,
  ) {
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const latitudeDelta = radians(destinationLat - originLat);
    const longitudeDelta = radians(destinationLng - originLng);
    const a =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(radians(originLat)) *
        Math.cos(radians(destinationLat)) *
        Math.sin(longitudeDelta / 2) ** 2;
    const directDistance =
      6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const roadFactor = this.config.get<number>('ONGKIR_ROAD_FACTOR', 1.25);
    return directDistance * roadFactor;
  }
}
