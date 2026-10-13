import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StubMetaDto {
  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 0 }) total!: number;
  @ApiProperty({ example: 0 }) totalPages!: number;
}

export class StubEntityDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  id!: string;

  @ApiProperty({ example: 'scaffold' })
  status!: string;

  @ApiPropertyOptional({
    example: 'Structural stub; business behavior is pending.',
  })
  note?: string;
}

export class StubListDto {
  @ApiProperty({ type: [StubEntityDto] }) data!: StubEntityDto[];
  @ApiProperty({ type: StubMetaDto }) meta!: StubMetaDto;
}

export const STUB_ID = '00000000-0000-0000-0000-000000000000';

export function stubEntity(id = STUB_ID): StubEntityDto {
  return {
    id,
    status: 'scaffold',
    note: 'Structural stub; business behavior is pending.',
  };
}

export function stubList(): StubListDto {
  return {
    data: [],
    meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}
