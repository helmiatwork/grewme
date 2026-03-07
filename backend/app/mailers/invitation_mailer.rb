# frozen_string_literal: true

class InvitationMailer < ApplicationMailer
  def teacher_invitation(invitation)
    @invitation = invitation
    @school = invitation.school
    @inviter = invitation.inviter
    @accept_url = "#{ENV.fetch("FRONTEND_URL", "http://localhost:5173")}/invitations/accept?token=#{invitation.token}"

    mail(
      to: invitation.email,
      subject: "You're invited to join #{@school.name} on GrewMe"
    )
  end
end
