import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Track online users: userId -> Set of active socket IDs
  private connectedUsers = new Map<string, Set<string>>();

  constructor(
    private chatService: ChatService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private addConnectedUser(userId: string, socketId: string) {
    if (!userId) return;
    const existing = this.connectedUsers.get(userId) || new Set<string>();
    const wasEmpty = existing.size === 0;
    existing.add(socketId);
    this.connectedUsers.set(userId, existing);

    if (wasEmpty && this.server) {
      this.server.emit('user:status', { userId, status: 'ONLINE' });
    }
  }

  private removeConnectedUser(socketId: string) {
    for (const [userId, socketSet] of this.connectedUsers.entries()) {
      if (socketSet.has(socketId)) {
        socketSet.delete(socketId);
        if (socketSet.size === 0) {
          this.connectedUsers.delete(userId);
          if (this.server) {
            this.server.emit('user:status', { userId, status: 'OFFLINE' });
          }
        }
        break;
      }
    }
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization?.startsWith('Bearer ')
          ? client.handshake.headers.authorization.slice(7)
          : null) ||
        (client.handshake.query?.token as string);

      if (token) {
        const payload: any = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'safnexbd_super_secret_jwt_access_key_2026_production_grade',
        });
        client.data.user = payload;
        client.join(`user:${payload.sub}`);
        this.addConnectedUser(payload.sub, client.id);
      }
    } catch {
      // Unauthenticated socket connection remains unprivileged
    }
  }

  handleDisconnect(client: Socket) {
    this.removeConnectedUser(client.id);
  }

  @SubscribeMessage('users:get_online')
  handleGetOnlineUsers(@ConnectedSocket() client: Socket) {
    const onlineList = Array.from(this.connectedUsers.keys());
    client.emit('users:online_list', onlineList);
    return { onlineUsers: onlineList };
  }

  @SubscribeMessage('user:join')
  handleUserJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; token?: string },
  ) {
    if (!client.data.user && data?.token) {
      try {
        const payload: any = this.jwtService.verify(data.token, {
          secret: process.env.JWT_SECRET || 'safnexbd_super_secret_jwt_access_key_2026_production_grade',
        });
        client.data.user = payload;
      } catch {}
    }

    const userId = client.data.user?.sub || data?.userId;
    if (userId) {
      client.join(`user:${userId}`);
      this.addConnectedUser(userId, client.id);
      return { event: 'joined', room: `user:${userId}` };
    }
    return { event: 'error', message: 'Unauthorized: Valid token or userId required' };
  }

  @SubscribeMessage('admin:join')
  async handleAdminJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { adminId?: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) {
      return { event: 'error', message: 'Unauthorized' };
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    const isAdmin = userRoles.some((ur) =>
      ['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN'].includes(ur.role.name),
    );

    if (!isAdmin) {
      return { event: 'error', message: 'Forbidden: Admin privilege required' };
    }

    client.join('room:admins');
    if (data?.adminId && data.adminId === userId) {
      client.join(`admin:${data.adminId}`);
    }
    return { event: 'joined', room: 'room:admins' };
  }

  @SubscribeMessage('staff:join')
  async handleStaffJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data?: { staffId?: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) {
      return { event: 'error', message: 'Unauthorized' };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isEmployee: true },
    });

    if (!user?.isEmployee) {
      return { event: 'error', message: 'Forbidden: Staff privilege required' };
    }

    client.join('room:staff');
    if (data?.staffId && data.staffId === userId) {
      client.join(`staff:${data.staffId}`);
    }
    return { event: 'joined', room: 'room:staff' };
  }

  @SubscribeMessage('join:conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; token?: string; userId?: string },
  ) {
    if (!client.data.user && data?.token) {
      try {
        const payload: any = this.jwtService.verify(data.token, {
          secret: process.env.JWT_SECRET || 'safnexbd_super_secret_jwt_access_key_2026_production_grade',
        });
        client.data.user = payload;
      } catch {}
    }

    const userId = client.data.user?.sub || data?.userId;
    if (!userId) {
      return { event: 'error', message: 'Unauthorized' };
    }

    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId: data.conversationId, userId },
    });

    if (!participant) {
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      const isAdmin = userRoles.some((ur) =>
        ['SUPER_ADMIN', 'ADMIN'].includes(ur.role.name),
      );
      if (!isAdmin) {
        return { event: 'error', message: 'Forbidden: Not a conversation participant' };
      }
    }

    client.join(data.conversationId);
    return { event: 'joined', conversationId: data.conversationId };
  }

  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(data.conversationId);
    return { event: 'left', conversationId: data.conversationId };
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      senderId: string;
      content: string;
      messageType?: any;
      metadata?: any;
      attachments?: any[];
    },
  ) {
    if (client.data?.user?.sub) {
      data.senderId = client.data.user.sub;
    }

    const savedMessage = await this.chatService.saveMessage({
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
      messageType: data.messageType,
      metadata: data.metadata,
      attachments: data.attachments,
    });

    return this.broadcastNewMessage(savedMessage, data.conversationId, data.senderId);
  }

  /**
   * Universal broadcast for new messages (used by WebSocket message:send and REST sendMessage)
   */
  async broadcastNewMessage(savedMessage: any, conversationId: string, senderId: string) {
    // Safely serialize BigInt attachments
    const serialized = JSON.parse(
      JSON.stringify(savedMessage, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    );

    // 1. Broadcast to conversation room
    this.server?.to(conversationId).emit('message:receive', serialized);

    // 2. Broadcast to participants' personal rooms & send notifications
    try {
      const participants = await this.prisma.conversationParticipant.findMany({
        where: { conversationId },
        select: { userId: true },
      });

      const senderFullName =
        `${savedMessage.sender?.firstName || ''} ${savedMessage.sender?.lastName || ''}`.trim() ||
        savedMessage.sender?.uniqueUserId ||
        'User';

      for (const p of participants) {
        // Also emit to personal room so conversation list snippet updates in real-time
        this.server?.to(`user:${p.userId}`).emit('message:receive', serialized);

        if (p.userId !== senderId) {
          this.server?.to(`user:${p.userId}`).emit('notification:message', {
            conversationId,
            messageId: savedMessage.id,
            senderId,
            senderName: senderFullName,
            senderAvatar: savedMessage.sender?.avatarUrl,
            content: savedMessage.content,
            messageType: savedMessage.messageType,
            createdAt: savedMessage.createdAt,
          });
        }
      }

      // If pay or receive request, also broadcast to admins
      if (savedMessage.messageType === 'PAY_REQUEST') {
        this.notifyAdmins('notification:admin', {
          type: 'PAY_REQUEST',
          title: 'নতুন পে-রিকোয়েস্ট',
          message: `${senderFullName} চ্যাটে নতুন পে-রিকোয়েস্ট পাঠিয়েছেন।`,
          targetUrl: `/admin/cms`,
          createdAt: savedMessage.createdAt,
        });
      } else if (savedMessage.messageType === 'RECEIVE_REQUEST') {
        this.notifyAdmins('notification:admin', {
          type: 'RECEIVE_REQUEST',
          title: 'নতুন রিসিভ রিকোয়েস্ট',
          message: `${senderFullName} চ্যাটে টাকা গ্রহণের অনুরোধ পাঠিয়েছেন।`,
          targetUrl: `/admin/cms`,
          createdAt: savedMessage.createdAt,
        });
      }
    } catch (err) {
      console.error('Failed to broadcast participant notification:', err);
    }

    return serialized;
  }

  @SubscribeMessage('message:seen')
  async handleMessageSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    await this.chatService.markAsSeen(data.conversationId, data.userId);
    client.to(data.conversationId).emit('message:seen', {
      conversationId: data.conversationId,
      userId: data.userId,
    });
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userName: string },
  ) {
    client.to(data.conversationId).emit('typing:start', data);
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userName: string },
  ) {
    client.to(data.conversationId).emit('typing:stop', data);
  }

  @SubscribeMessage('transaction:update')
  handleTransactionUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; transaction: any },
  ) {
    this.server.to(data.conversationId).emit('transaction:update', data);
  }

  /**
   * Helper to send real-time notification to a specific user's personal room
   */
  notifyUser(userId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit(event, payload);
    }
  }

  /**
   * Helper to send real-time notification to all Super Admins
   */
  notifyAdmins(event: string, payload: any) {
    if (this.server) {
      this.server.to('room:admins').emit(event, payload);
    }
  }

  /**
   * Helper to send real-time notification to all Staff/Employees
   */
  notifyStaff(event: string, payload: any) {
    if (this.server) {
      this.server.to('room:staff').emit(event, payload);
    }
  }

  /**
   * Helper to send real-time notification to both Admins and Staff
   */
  notifyAdminsAndStaff(event: string, payload: any) {
    if (this.server) {
      this.server.to('room:admins').emit(event, payload);
      this.server.to('room:staff').emit(event, payload);
    }
  }
}
