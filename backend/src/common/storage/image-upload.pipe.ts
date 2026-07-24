import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export type UploadedImage = Express.Multer.File & {
  detectedExtension: 'jpg' | 'png' | 'webp';
};

@Injectable()
export class ImageUploadPipe implements PipeTransform<
  Express.Multer.File | undefined,
  UploadedImage
> {
  transform(file?: Express.Multer.File): UploadedImage {
    if (!file?.buffer?.length)
      throw new BadRequestException('File gambar wajib dipilih');
    const maxBytes = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 5) * 1024 * 1024;
    if (file.size > maxBytes)
      throw new BadRequestException('Ukuran gambar melebihi batas unggahan');

    const b = file.buffer;
    const pngSignature =
      b.length >= 20 &&
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const pngEnd =
      b.length >= 12 &&
      b
        .subarray(b.length - 8)
        .equals(Buffer.from([73, 69, 78, 68, 174, 66, 96, 130]));
    const png = pngSignature && pngEnd;
    const jpeg =
      b.length >= 4 &&
      b[0] === 0xff &&
      b[1] === 0xd8 &&
      b[2] === 0xff &&
      b[b.length - 2] === 0xff &&
      b[b.length - 1] === 0xd9;
    const webp =
      b.length >= 12 &&
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP';
    if (!png && !jpeg && !webp)
      throw new BadRequestException(
        'Isi file bukan gambar JPG, PNG, atau WEBP yang valid',
      );
    const expectedMime = png ? 'image/png' : webp ? 'image/webp' : 'image/jpeg';
    if (
      file.mimetype !== expectedMime &&
      !(jpeg && file.mimetype === 'image/jpg')
    ) {
      throw new BadRequestException('Tipe file tidak sesuai dengan isi gambar');
    }
    return Object.assign(file, {
      detectedExtension: png ? 'png' : webp ? 'webp' : 'jpg',
    }) as UploadedImage;
  }
}
