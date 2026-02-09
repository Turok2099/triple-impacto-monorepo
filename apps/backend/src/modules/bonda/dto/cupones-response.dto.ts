import { CuponDto } from './cupon.dto';

export class CuponesResponseDto {
  count: number;
  cupones: CuponDto[];
  next?: string | null;
  previous?: string | null;
}
