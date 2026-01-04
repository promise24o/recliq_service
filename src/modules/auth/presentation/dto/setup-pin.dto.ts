import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupPinDto {
  @ApiProperty({ 
    description: 'Transaction PIN (4-6 digits)', 
    example: '1234',
    minLength: 4,
    maxLength: 6
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(4, { message: 'PIN must be at least 4 digits long' })
  @MaxLength(6, { message: 'PIN must not exceed 6 digits' })
  @Matches(/^[0-9]+$/, { message: 'PIN must contain only numbers' })
  pin: string;
}
