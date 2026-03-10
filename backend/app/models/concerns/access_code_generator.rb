module AccessCodeGenerator
  CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".chars.freeze

  def self.generate(length: 6)
    Array.new(length) { CHARSET.sample }.join
  end
end
