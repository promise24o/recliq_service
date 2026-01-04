import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import B2 from 'backblaze-b2';

@Injectable()
export class BackblazeService {
  private b2: B2;
  private bucketId: string;
  private bucketName: string;

  constructor(
    private configService: ConfigService,
  ) {
    this.b2 = new B2({
      applicationKeyId: this.configService.get<string>('BACKBLAZE_APP_KEY_ID')!,
      applicationKey: this.configService.get<string>('BACKBLAZE_APP_KEY')!,
    });
    this.bucketId = this.configService.get<string>('BACKBLAZE_BUCKET_ID')!;
    this.bucketName = this.configService.get<string>('BACKBLAZE_BUCKET')!;
  }

  private async initializeB2() {
    try {
      await this.b2.authorize();
    } catch (error) {
      throw new Error(`Backblaze authorization failed: ${error.message}`);
    }
  }

  private generateFileName(userId: string, originalName?: string): string {
    const timestamp = Date.now();
    const sanitizedOriginalName = originalName ? originalName.replace(/\s+/g, '_') : 'profile-photo';
    return `${userId}/profile-${timestamp}-${sanitizedOriginalName}`;
  }

  async uploadProfilePhoto(
    userId: string,
    file: Buffer,
    mimeType: string,
    originalName?: string,
  ): Promise<string> {
    try {
      await this.initializeB2();

      if (!this.bucketId || !this.bucketName) {
        throw new Error('Backblaze configuration missing');
      }

      const fileName = this.generateFileName(userId, originalName);

      // Get upload URL
      const uploadUrlResponse = await this.b2.getUploadUrl({ bucketId: this.bucketId });

      // Upload file
      const uploadResponse = await this.b2.uploadFile({
        uploadUrl: uploadUrlResponse.data.uploadUrl,
        uploadAuthToken: uploadUrlResponse.data.authorizationToken,
        fileName,
        data: file,
        mime: mimeType,
      });

      // Construct public URL
      const fileUrl = `https://f003.backblazeb2.com/file/${this.bucketName}/${uploadResponse.data.fileName}`;

      return fileUrl;
    } catch (error) {
      throw new Error(`Failed to upload profile photo: ${error.message}`);
    }
  }

  async deleteProfilePhoto(photoUrl: string): Promise<void> {
    try {
      await this.initializeB2();

      // Extract file name from URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts.slice(5).join('/'); // Remove domain parts

      // Get file info first
      const fileInfo = await this.b2.listFileNames({
        bucketId: this.bucketId,
        startFileName: fileName,
        maxFileCount: 1,
        delimiter: '',
        prefix: '',
      });

      if (fileInfo.data.files.length > 0) {
        const file = fileInfo.data.files[0];
        
        // Delete file version
        await this.b2.deleteFileVersion({
          fileId: file.fileId,
          fileName: file.fileName,
        });
      }
    } catch (error) {
      throw new Error(`Failed to delete profile photo: ${error.message}`);
    }
  }

  async getUserProfilePhotos(userId: string): Promise<string[]> {
    try {
      await this.initializeB2();

      const response = await this.b2.listFileNames({
        bucketId: this.bucketId,
        prefix: `${userId}/`,
        maxFileCount: 100,
        startFileName: '',
        delimiter: '',
      });

      return response.data.files.map(file => 
        `https://f003.backblazeb2.com/file/${this.bucketName}/${file.fileName}`
      );
    } catch (error) {
      throw new Error(`Failed to list user photos: ${error.message}`);
    }
  }
}
