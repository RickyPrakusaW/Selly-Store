import { BadRequestException } from '@nestjs/common';
import { ImageUploadPipe } from './image-upload.pipe';

describe('ImageUploadPipe', () => {
  const pipe = new ImageUploadPipe();

  const file = (buffer: Buffer, mimetype: string) =>
    ({
      buffer,
      mimetype,
      size: buffer.length,
      originalname: 'proof.png',
      fieldname: 'file',
      encoding: '7bit',
      stream: undefined,
      destination: '',
      filename: '',
      path: '',
    }) as unknown as Express.Multer.File;

  it('accepts a PNG with matching start and end markers', () => {
    const buffer = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      Buffer.alloc(16),
      Buffer.from([73, 69, 78, 68, 174, 66, 96, 130]),
    ]);
    expect(pipe.transform(file(buffer, 'image/png')).detectedExtension).toBe(
      'png',
    );
  });

  it('accepts a WEBP image with a valid RIFF container signature', () => {
    const buffer = Buffer.concat([
      Buffer.from('RIFF', 'ascii'),
      Buffer.alloc(4),
      Buffer.from('WEBP', 'ascii'),
      Buffer.from('VP8 ', 'ascii'),
      Buffer.alloc(16),
    ]);
    expect(pipe.transform(file(buffer, 'image/webp')).detectedExtension).toBe(
      'webp',
    );
  });

  it('rejects executable content renamed as PNG', () => {
    expect(() =>
      pipe.transform(file(Buffer.from('MZ executable content'), 'image/png')),
    ).toThrow(BadRequestException);
  });

  it('rejects a MIME type that disagrees with the bytes', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]);
    expect(() => pipe.transform(file(jpeg, 'image/png'))).toThrow(
      BadRequestException,
    );
  });
});
