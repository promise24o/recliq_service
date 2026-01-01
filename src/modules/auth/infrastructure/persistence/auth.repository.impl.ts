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

  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async save(user: User): Promise<User> {
    const doc = this.toDocument(user);
    const saved = await this.userModel.findByIdAndUpdate(
      user.id,
      doc,
      { upsert: true, new: true },
    ).exec();
    return this.toEntity(saved);
  }

  async update(user: User): Promise<User> {
    const doc = this.toDocument(user);
    const updated = await this.userModel.findByIdAndUpdate(user.id, doc, { new: true }).exec();
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
      doc.isVerified,
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
      isVerified: user.isVerified,
      otp: user.otp,
      otpExpiresAt: user.otpExpiresAt,
    };
  }
}