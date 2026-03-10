class FormulaEvaluator
  def self.evaluate(formula, variables)
    calculator = Dentaku::Calculator.new
    # Convert string keys to symbols for Dentaku
    vars = variables.transform_keys(&:to_sym).transform_values(&:to_f)
    calculator.evaluate(formula, vars)
  rescue Dentaku::ParseError, Dentaku::UnboundVariableError, ZeroDivisionError => e
    Rails.logger.warn("FormulaEvaluator error: #{e.message} for formula='#{formula}' vars=#{variables}")
    nil
  end

  def self.evaluate_to_s(formula, variables)
    result = evaluate(formula, variables)
    return nil if result.nil?

    # Format: remove trailing zeros (17.0 -> "17", 17.5 -> "17.5")
    (result == result.to_i) ? result.to_i.to_s : result.to_s
  end
end
