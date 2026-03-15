# app/mailers/

## Responsibility
Email delivery for invitations and consent requests. Minimal mailer layer — most communication happens via in-app notifications and push.

## Design
- **ApplicationMailer**: Base class with default from address
- **InvitationMailer**: Sends invitation emails with accept link (contains token)
- **ConsentMailer**: Sends parental consent request emails with verification link

## Flow
1. Mutation creates Invitation/Consent record
2. Mailer called (inline or via background job)
3. Email rendered with HTML/text templates
4. Delivered via configured mail service

## Integration
- **Called by**: CreateInvitation mutation, RequestConsent mutation
- **Templates**: `app/views/invitation_mailer/`, `app/views/consent_mailer/`
