# frozen_string_literal: true

class ConsentMailer < ApplicationMailer
  def consent_request(consent)
    @consent = consent
    @student = consent.student
    @accept_url = "#{ENV.fetch("FRONTEND_URL", "http://localhost:5173")}/consent/grant?token=#{consent.token}"
    @decline_url = "#{ENV.fetch("FRONTEND_URL", "http://localhost:5173")}/consent/decline?token=#{consent.token}"
    @privacy_url = "#{ENV.fetch("FRONTEND_URL", "http://localhost:5173")}/privacy"

    mail(
      to: consent.parent_email,
      subject: "Parental Consent Required for #{@student.name} on GrewMe"
    )
  end

  def consent_confirmation(consent)
    @consent = consent
    @student = consent.student
    @parent = consent.parent

    mail(
      to: consent.parent_email,
      subject: "Consent Confirmed for #{@student.name} on GrewMe"
    )
  end

  def consent_reminder(consent)
    @consent = consent
    @student = consent.student
    @accept_url = "#{ENV.fetch("FRONTEND_URL", "http://localhost:5173")}/consent/grant?token=#{consent.token}"
    @decline_url = "#{ENV.fetch("FRONTEND_URL", "http://localhost:5173")}/consent/decline?token=#{consent.token}"

    mail(
      to: consent.parent_email,
      subject: "Reminder: Parental Consent Needed for #{@student.name} on GrewMe"
    )
  end
end
