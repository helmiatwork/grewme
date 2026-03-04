class Rack::Attack
  # Disable rate limiting in test environment
  if Rails.env.test?
    self.enabled = false
  end

  # Login: 5 attempts per 20 seconds per IP
  throttle("auth/login/ip", limit: 5, period: 20.seconds) do |req|
    req.ip if req.path.match?(%r{/api/v1/auth/login}) && req.post?
  end

  # Login: 6 attempts per 60 seconds per email
  throttle("auth/login/email", limit: 6, period: 60.seconds) do |req|
    if req.path.match?(%r{/api/v1/auth/login}) && req.post?
      body = begin
        JSON.parse(req.body.read)
      rescue
        {}
      end
      req.body.rewind
      body["email"]&.downcase&.strip
    end
  end

  # Registration: 3 per hour per IP
  throttle("auth/register/ip", limit: 3, period: 1.hour) do |req|
    req.ip if req.path.match?(%r{/api/v1/auth/register}) && req.post?
  end

  # General API: 120 requests per minute per IP
  throttle("api/ip", limit: 120, period: 60.seconds) do |req|
    req.ip if req.path.start_with?("/api/")
  end

  # Custom JSON response for throttled requests
  self.throttled_responder = lambda do |req|
    [ 429, { "Content-Type" => "application/json" },
      [ { error: { code: "rate_limited", message: "Too many requests. Try again later." } }.to_json ] ]
  end
end
