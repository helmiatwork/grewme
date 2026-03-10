require "test_helper"

class AccessCodeGeneratorTest < ActiveSupport::TestCase
  test "generates a 6-character alphanumeric code" do
    code = AccessCodeGenerator.generate
    assert_equal 6, code.length
    assert_match(/\A[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}\z/, code)
  end

  test "excludes ambiguous characters" do
    100.times do
      code = AccessCodeGenerator.generate
      refute_match(/[0OoIil1L]/, code)
    end
  end
end
