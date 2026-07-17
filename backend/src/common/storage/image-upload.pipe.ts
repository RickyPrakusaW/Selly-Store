import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

export type UploadedImage = Express.Multer.File & {
  detectedExtension: 'jpg' | 'png';
};

@Injectable()
export class ImageUploadPipe implements PipeTransform<
  Express.Multer.File | undefined,
  UploadedImage
> {
  transform(file?: Express.Multer.File): UploadedImage {
    if (!file?.buffer?.length)
      throw new BadRequestException('Image file is required');
    const maxBytes = Number(process.env.MAX_UPLOAD_SIZE_MB ?? 2) * 1024 * 1024;
    if (file.size > maxBytes)
      throw new BadRequestException('Image exceeds the upload size limit');

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
    if (!png && !jpeg)
      throw new BadRequestException('File content is not a valid JPG or PNG');
    const expectedMime = png ? 'image/png' : 'image/jpeg';
    if (
      file.mimetype !== expectedMime &&
      !(jpeg && file.mimetype === 'image/jpg')
    ) {
      throw new BadRequestException(
        'File MIME type does not match its content',
      );
    }
    return Object.assign(file, {
      detectedExtension: png ? 'png' : 'jpg',
    }) as UploadedImage;
  }
}
