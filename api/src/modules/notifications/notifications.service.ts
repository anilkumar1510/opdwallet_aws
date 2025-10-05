import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationType, NotificationPriority } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) {}

  async createNotification(data: {
    userId: string | Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    claimId?: string | Types.ObjectId;
    claimNumber?: string;
    priority?: NotificationPriority;
    metadata?: any;
    actionUrl?: string;
  }) {
    const notification = new this.notificationModel({
      userId: new Types.ObjectId(data.userId),
      type: data.type,
      title: data.title,
      message: data.message,
      claimId: data.claimId ? new Types.ObjectId(data.claimId) : undefined,
      claimNumber: data.claimNumber,
      priority: data.priority || NotificationPriority.MEDIUM,
      metadata: data.metadata,
      actionUrl: data.actionUrl,
    });

    return notification.save();
  }

  async getUserNotifications(
    userId: string,
    options: {
      unreadOnly?: boolean;
      type?: NotificationType;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { unreadOnly = false, type, page = 1, limit = 20 } = options;

    const query: any = { userId: new Types.ObjectId(userId), isActive: true };
    if (unreadOnly) query.isRead = false;
    if (type) query.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(query),
      this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: false,
        isActive: true,
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true },
    );

    return notification;
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return { modifiedCount: result.modifiedCount };
  }

  async deleteNotification(notificationId: string, userId: string) {
    const result = await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      },
      {
        isActive: false,
      },
      { new: true },
    );

    return result;
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      isRead: false,
      isActive: true,
    });

    return { unreadCount: count };
  }

  // Helper methods for creating specific notification types
  async notifyClaimStatusChange(
    userId: string | Types.ObjectId,
    claimId: string | Types.ObjectId,
    claimNumber: string,
    oldStatus: string,
    newStatus: string,
    actionBy: string,
  ) {
    const statusMessages: Record<string, { title: string; message: string; priority: NotificationPriority }> = {
      ASSIGNED: {
        title: 'Claim Assigned for Review',
        message: `Your claim ${claimNumber} has been assigned to a TPA reviewer.`,
        priority: NotificationPriority.MEDIUM,
      },
      UNDER_REVIEW: {
        title: 'Claim Under Review',
        message: `Your claim ${claimNumber} is now under review by ${actionBy}.`,
        priority: NotificationPriority.MEDIUM,
      },
      DOCUMENTS_REQUIRED: {
        title: 'Additional Documents Required',
        message: `Additional documents are required for claim ${claimNumber}. Please submit them as soon as possible.`,
        priority: NotificationPriority.HIGH,
      },
      APPROVED: {
        title: 'Claim Approved!',
        message: `Great news! Your claim ${claimNumber} has been approved by ${actionBy}.`,
        priority: NotificationPriority.HIGH,
      },
      PARTIALLY_APPROVED: {
        title: 'Claim Partially Approved',
        message: `Your claim ${claimNumber} has been partially approved by ${actionBy}.`,
        priority: NotificationPriority.HIGH,
      },
      REJECTED: {
        title: 'Claim Rejected',
        message: `Unfortunately, your claim ${claimNumber} has been rejected by ${actionBy}.`,
        priority: NotificationPriority.URGENT,
      },
      PAYMENT_PENDING: {
        title: 'Payment Processing',
        message: `Your claim ${claimNumber} has been approved and payment is being processed.`,
        priority: NotificationPriority.MEDIUM,
      },
      PAYMENT_COMPLETED: {
        title: 'Payment Completed!',
        message: `Payment for claim ${claimNumber} has been completed successfully.`,
        priority: NotificationPriority.HIGH,
      },
    };

    const notificationData = statusMessages[newStatus] || {
      title: 'Claim Status Updated',
      message: `Your claim ${claimNumber} status has been updated to ${newStatus}.`,
      priority: NotificationPriority.MEDIUM,
    };

    return this.createNotification({
      userId,
      type: NotificationType.CLAIM_STATUS_CHANGED,
      title: notificationData.title,
      message: notificationData.message,
      claimId,
      claimNumber,
      priority: notificationData.priority,
      metadata: { oldStatus, newStatus, actionBy },
      actionUrl: `/member/claims/${claimNumber}`,
    });
  }

  async notifyDocumentsRequested(
    userId: string | Types.ObjectId,
    claimId: string | Types.ObjectId,
    claimNumber: string,
    documentsRequested: string[],
    requestedBy: string,
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.DOCUMENTS_REQUESTED,
      title: 'Additional Documents Required',
      message: `${requestedBy} has requested ${documentsRequested.length} additional document(s) for claim ${claimNumber}.`,
      claimId,
      claimNumber,
      priority: NotificationPriority.HIGH,
      metadata: { documentsRequested, requestedBy },
      actionUrl: `/member/claims/${claimNumber}`,
    });
  }

  async notifyPaymentCompleted(
    userId: string | Types.ObjectId,
    claimId: string | Types.ObjectId,
    claimNumber: string,
    amount: number,
    paymentMode: string,
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.PAYMENT_COMPLETED,
      title: 'Payment Completed Successfully',
      message: `Payment of ₹${amount.toLocaleString()} for claim ${claimNumber} has been completed via ${paymentMode}.`,
      claimId,
      claimNumber,
      priority: NotificationPriority.HIGH,
      metadata: { amount, paymentMode },
      actionUrl: `/member/claims/${claimNumber}`,
    });
  }
}
