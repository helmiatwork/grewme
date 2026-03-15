# app/channels/application_cable/

## Responsibility
Base classes for ActionCable: Connection (WebSocket auth) and Channel (base behavior).

## Design
- **Connection**: `identified_by :current_user`. On connect: extract JWT from query params or cookies, decode, find user. Reject unauthorized connections.
- **Channel**: Base class for all channels.

## Flow
WebSocket handshake → Connection#connect → JWT auth → identified_by :current_user → Channel subscriptions

## Integration
- **All channels** inherit from ApplicationCable::Channel
- **JWT auth** shared with HTTP layer
