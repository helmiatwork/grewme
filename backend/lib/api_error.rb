module ApiError
  class Base < StandardError
    attr_reader :status, :code
    def initialize(message = nil, status: :internal_server_error, code: nil)
      @status = status
      @code = code || self.class.name.demodulize.underscore
      super(message || "An error occurred")
    end
  end

  class NotFound < Base
    def initialize(msg = "Resource not found")
      super(msg, status: :not_found)
    end
  end

  class Forbidden < Base
    def initialize(msg = "You don't have permission")
      super(msg, status: :forbidden)
    end
  end

  class Unauthorized < Base
    def initialize(msg = "Authentication required")
      super(msg, status: :unauthorized)
    end
  end

  class RateLimited < Base
    def initialize(msg = "Too many requests")
      super(msg, status: :too_many_requests, code: "rate_limited")
    end
  end
end
