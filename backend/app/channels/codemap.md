# app/channels/

## Responsibility
ActionCable WebSocket channels for real-time features: live notifications, direct messaging, and group chat.

## Design
- **ApplicationCable::Connection**: JWT authentication on WebSocket connect — same token validation as HTTP
- **NotificationsChannel**: Stream per-user notifications. Client subscribes with user type/ID.
- **ChatChannel**: Direct message stream per conversation. Validates user membership before subscribing.
- **GroupChatChannel**: Group message stream per group conversation.

## Flow
1. Client connects: `ws://host/cable` with JWT token
2. Connection#connect → JWT decode → `identified_by :current_user`
3. Client subscribes to channel (e.g., NotificationsChannel)
4. Channel verifies authorization → `stream_for(user)` or `stream_for(conversation)`
5. Server broadcasts via `ActionCable.server.broadcast` or `Channel.broadcast_to`

## Integration
- **NotificationsChannel**: Receives broadcasts from NotificationService
- **ChatChannel**: Receives broadcasts from SendMessage mutation
- **GroupChatChannel**: Receives broadcasts from SendGroupMessage mutation
- **Auth**: Same JWT validation as GraphQL (shared Authenticatable logic)
