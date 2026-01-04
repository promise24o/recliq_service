import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePinDto {
  @ApiProperty({ 
    description: 'Current PIN', 
    example: '1234',
    minLength: 4,
    maxLength: 6
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6, { message: 'PIN must be between 4 and 6 digits' })
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  oldPin: string;

  @ApiProperty({ 
    description: 'New PIN', 
    example: '5678',
    minLength: 4,
    maxLength: 6
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 6, { message: 'PIN must be between 4 and 6 digits' })
  @Matches(/^\d+$/, { message: 'PIN must contain only digits' })
  newPin: string;
}
