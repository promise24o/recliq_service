import { Controller, Get, Post, Put, Patch, Body, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/guards/roles.decorator';
import { UserRole } from '../../../auth/domain/constants/user.constants';
import { GetVehicleDetailsUseCase } from '../../application/use-cases/get-vehicle-details.usecase';
import { CreateVehicleDetailsUseCase } from '../../application/use-cases/create-vehicle-details.usecase';
import { UpdateVehicleDetailsUseCase } from '../../application/use-cases/update-vehicle-details.usecase';
import { UploadVehicleDocumentUseCase } from '../../application/use-cases/upload-vehicle-document.usecase';
import { UpdateVehicleStatusUseCase } from '../../application/use-cases/update-vehicle-status.usecase';
import { CreateVehicleDetailsDto, UpdateVehicleDetailsDto, UploadVehicleDocumentDto, UpdateVehicleStatusDto, VehicleDetailsResponseDto } from '../dto/vehicle-details.dto';

@ApiTags('Vehicle Details')
@Controller('vehicle-details')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VehicleDetailsController {
  constructor(
    private readonly getVehicleDetailsUseCase: GetVehicleDetailsUseCase,
    private readonly createVehicleDetailsUseCase: CreateVehicleDetailsUseCase,
    private readonly updateVehicleDetailsUseCase: UpdateVehicleDetailsUseCase,
    private readonly uploadVehicleDocumentUseCase: UploadVehicleDocumentUseCase,
    private readonly updateVehicleStatusUseCase: UpdateVehicleStatusUseCase,
  ) {}

  @Get()
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Get vehicle details' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle details retrieved successfully',
    type: VehicleDetailsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Vehicle details not found' })
  async getVehicleDetails(@Request() req): Promise<VehicleDetailsResponseDto> {
    return this.getVehicleDetailsUseCase.execute(req.user.id);
  }

  @Post()
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Create vehicle details' })
  @ApiResponse({
    status: 201,
    description: 'Vehicle details created successfully',
    type: VehicleDetailsResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Vehicle details already exist' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createVehicleDetails(
    @Request() req,
    @Body() dto: CreateVehicleDetailsDto,
  ): Promise<VehicleDetailsResponseDto> {
    return this.createVehicleDetailsUseCase.execute(req.user.id, dto);
  }

  @Put()
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Update vehicle details' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle details updated successfully',
    type: VehicleDetailsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Vehicle details not found' })
  async updateVehicleDetails(
    @Request() req,
    @Body() dto: UpdateVehicleDetailsDto,
  ): Promise<VehicleDetailsResponseDto> {
    return this.updateVehicleDetailsUseCase.execute(req.user.id, dto);
  }

  @Post('documents/upload')
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Upload vehicle document' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documentType: {
          type: 'string',
          enum: ['registration', 'insurance', 'roadworthiness', 'inspection_certificate'],
          description: 'Document type',
          example: 'registration'
        },
        document: {
          type: 'string',
          format: 'binary',
          description: 'Document file (PDF, JPG, PNG)'
        }
      },
      required: ['documentType', 'document']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Document uploaded successfully',
    type: VehicleDetailsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Vehicle details not found' })
  async uploadDocument(
    @Request() req,
    @Body() body: { documentType: string },
    @UploadedFile() document: Express.Multer.File,
  ): Promise<VehicleDetailsResponseDto> {
    return this.uploadVehicleDocumentUseCase.execute(req.user.id, body.documentType, document);
  }

  @Patch('status')
  @Roles(UserRole.USER, UserRole.AGENT)
  @ApiOperation({ summary: 'Update vehicle status' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle status updated successfully',
    type: VehicleDetailsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Vehicle details not found' })
  async updateVehicleStatus(
    @Request() req,
    @Body() dto: UpdateVehicleStatusDto,
  ): Promise<VehicleDetailsResponseDto> {
    return this.updateVehicleStatusUseCase.execute(req.user.id, dto);
  }
}
