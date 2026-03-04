class ProgressDataResource
  include Alba::Resource

  root_key :progress

  attribute :period do |entry|
    entry[:period]
  end

  attribute :skills do |entry|
    {
      reading: entry[:reading]&.round(1),
      math: entry[:math]&.round(1),
      writing: entry[:writing]&.round(1),
      logic: entry[:logic]&.round(1),
      social: entry[:social]&.round(1)
    }
  end
end
