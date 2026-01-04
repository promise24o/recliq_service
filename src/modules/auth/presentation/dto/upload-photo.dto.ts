import { ApiProperty } from '@nestjs/swagger';

export class UploadPhotoDto {
  @ApiProperty({ 
    type: 'string',
    format: 'binary',
    description: 'Profile photo file (JPEG, PNG, JPG)',
  })
  photo: any;
}
