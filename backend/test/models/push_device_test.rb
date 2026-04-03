require "test_helper"

class PushDeviceTest < ActiveSupport::TestCase
  def build_device(overrides = {})
    PushDevice.new({
      user: teachers(:teacher_alice),
      token: "unique-device-token-#{SecureRandom.hex(8)}",
      platform: "ios",
      active: true
    }.merge(overrides))
  end

  test "valid with user, token, and platform" do
    assert build_device.valid?
  end

  test "validates token presence" do
    device = build_device(token: nil)
    assert_not device.valid?
    assert_includes device.errors[:token], "can't be blank"
  end

  test "validates token uniqueness" do
    device = build_device(token: "duplicate-token")
    device.save!
    duplicate = build_device(token: "duplicate-token")
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:token], "has already been taken"
  end

  test "validates platform presence" do
    device = build_device(platform: nil)
    assert_not device.valid?
    assert_includes device.errors[:platform], "can't be blank"
  end

  test "validates platform inclusion" do
    device = build_device(platform: "blackberry")
    assert_not device.valid?
    assert_includes device.errors[:platform], "is not included in the list"
  end

  test "PLATFORMS constant contains expected values" do
    assert_equal %w[android ios web], PushDevice::PLATFORMS
  end

  test "belongs to user polymorphically" do
    device = build_device(user: teachers(:teacher_alice))
    assert_equal teachers(:teacher_alice), device.user
  end

  test "active scope returns active devices" do
    device = build_device(active: true)
    device.save!
    assert_includes PushDevice.active, device
  end

  test "active scope excludes inactive devices" do
    device = build_device(active: false)
    device.save!
    assert_not_includes PushDevice.active, device
  end

  test "for_platform scope filters by platform" do
    ios_device = build_device(platform: "ios")
    ios_device.save!
    android_device = build_device(platform: "android")
    android_device.save!

    results = PushDevice.for_platform("ios")
    assert_includes results, ios_device
    assert_not_includes results, android_device
  end

  test "deactivate! sets active to false" do
    device = build_device
    device.save!
    device.deactivate!
    assert_not device.active
  end
end
