import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../domain/entities/user.entity';
import { IAuthRepository } from '../../domain/repositories/auth.repository';
import { UserDocument } from './user.model';
import { Email } from '../../domain/value-objects/email.vo';
import { Phone } from '../../domain/value-objects/phone.vo';

@Injectable()
export class AuthRepositoryImpl implements IAuthRepository {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ email }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ phone }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ referralCode }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async findByRole(role: string): Promise<User[]> {
    const docs = await this.userModel.find({ role }).exec();
    return docs.map(doc => this.toEntity(doc));
  }

  async save(user: User): Promise<User> {
    const doc = this.toDocument(user);
    let saved;
    
    if (user.id) {
      // Update existing user - handle undefined fields properly
      const updateData: any = {
        name: user.name,
        email: user.email?.getValue(),
        phone: user.phone?.getValue(),
        role: user.role,
        isVerified: user.isVerified,
        updatedAt: new Date(),
        $unset: {}, // Initialize $unset object
      };
      
      // Only include OTP fields if they exist, otherwise unset them
      if (user.otp !== undefined) {
        updateData.otp = user.otp;
      } else {
        updateData.$unset = { ...updateData.$unset, otp: 1 };
      }
      
      if (user.otpExpiresAt !== undefined) {
        updateData.otpExpiresAt = user.otpExpiresAt;
      } else {
        updateData.$unset = { ...updateData.$unset, otpExpiresAt: 1 };
      }
      
      // Handle adminSubRole - include if set, unset if undefined
      if (user.adminSubRole !== undefined) {
        updateData.adminSubRole = user.adminSubRole;
      } else {
        updateData.$unset = { ...updateData.$unset, adminSubRole: 1 };
      }
      
      saved = await this.userModel.findByIdAndUpdate(
        user.id,
        updateData,
        { new: true }
      ).exec();
    } else {
      // Create new user
      saved = await this.userModel.create(doc);
    }
    
    if (!saved) {
      throw new Error('Failed to save user');
    }
    
    return this.toEntity(saved);
  }

  async update(user: User): Promise<User> {
    const doc = this.toDocument(user);
    
    // Build update object, explicitly handle undefined fields
    const updateData: any = {
      name: user.name,
      email: user.email?.getValue(),
      phone: user.phone?.getValue(),
      role: user.role,
      isVerified: user.isVerified,
      biometricEnabled: user.biometricEnabled,
      profilePhoto: user.profilePhoto,
      referralCode: user.referralCode,
      notifications: user.notifications,
      location: user.location,  // ✅ Add location field
      updatedAt: new Date(),
      $unset: {}, // Initialize $unset object
    };
    
    // Only include password if it exists
    if (user.password !== undefined) {
      updateData.password = user.password;
    }
    
    // Only include PIN if it exists
    if (user.pin !== undefined) {
      updateData.pin = user.pin;
    }
    
    // Handle adminSubRole - include if set, unset if undefined
    if (user.adminSubRole !== undefined) {
      updateData.adminSubRole = user.adminSubRole;
    } else {
      updateData.$unset = { ...updateData.$unset, adminSubRole: 1 };
    }
    
    // Only include OTP fields if they exist, otherwise unset them
    if (user.otp !== undefined) {
      updateData.otp = user.otp;
    } else {
      updateData.$unset = { ...updateData.$unset, otp: 1 };
    }
    
    if (user.otpExpiresAt !== undefined) {
      updateData.otpExpiresAt = user.otpExpiresAt;
    } else {
      updateData.$unset = { ...updateData.$unset, otpExpiresAt: 1 };
    }
    
    const updated = await this.userModel.findByIdAndUpdate(user.id, updateData, { new: true }).exec();
    if (!updated) {
      throw new Error('User not found');
    }
    return this.toEntity(updated);
  }

  private toEntity(doc: UserDocument): User {
    return new User(
      doc._id.toString(),
      doc.name,
      doc.email ? Email.create(doc.email) : undefined,
      doc.phone ? Phone.create(doc.phone) : undefined,
      doc.role,
      doc.adminSubRole,
      doc.isVerified,
      doc.password,
      doc.pin,
      doc.biometricEnabled || false,  // Default to false if undefined
      doc.profilePhoto,               // Can be undefined
      doc.referralCode,               // Can be undefined
      doc.notifications || {          // Default to false values if undefined
        priceUpdates: false,
        loginEmails: false,
        // Admin notification preferences with defaults
        loginAlerts: { email: true, inApp: true },
        passwordChanges: { email: true, inApp: true },
        failedLoginAttempts: { email: true, inApp: true },
        pickupEscalations: { email: true, inApp: true },
        agentStatusChanges: { email: false, inApp: true },
        paymentApprovals: { email: true, inApp: true },
        floatAlerts: { email: true, inApp: true },
        systemUpdates: { email: false, inApp: true },
      },
      doc.location,                     // Location field
      doc.otp,
      doc.otpExpiresAt,
      doc.createdAt,
      doc.updatedAt,
    );
  }

  private toDocument(user: User): Partial<UserDocument> {
    return {
      name: user.name,
      email: user.email?.getValue(),
      phone: user.phone?.getValue(),
      role: user.role,
      adminSubRole: user.adminSubRole,
      isVerified: user.isVerified,
      password: user.password,
      pin: user.pin,
      biometricEnabled: user.biometricEnabled,
      profilePhoto: user.profilePhoto,
      referralCode: user.referralCode,
      notifications: user.notifications,
      location: user.location,  // Add location field
      otp: user.otp,
      otpExpiresAt: user.otpExpiresAt,
    };
  }
}