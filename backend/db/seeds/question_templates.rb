# Parameterized question template library
templates = [
  # Arithmetic (Grade 1-6)
  { name: "Addition", category: "arithmetic", grade_min: 1, grade_max: 6,
   template_text: "What is {a} + {b}?",
   variables: [ { name: "a", min: 1, max: 100 }, { name: "b", min: 1, max: 100 } ],
   formula: "a + b" },
  { name: "Subtraction", category: "arithmetic", grade_min: 1, grade_max: 6,
   template_text: "What is {a} - {b}?",
   variables: [ { name: "a", min: 10, max: 100 }, { name: "b", min: 1, max: 50 } ],
   formula: "a - b" },
  { name: "Multiplication", category: "arithmetic", grade_min: 2, grade_max: 6,
   template_text: "What is {a} × {b}?",
   variables: [ { name: "a", min: 1, max: 12 }, { name: "b", min: 1, max: 12 } ],
   formula: "a * b" },
  { name: "Division", category: "arithmetic", grade_min: 2, grade_max: 6,
   template_text: "What is {dividend} ÷ {divisor}?",
   variables: [ { name: "divisor", min: 1, max: 12 }, { name: "dividend", min: 1, max: 144 } ],
   formula: "dividend / divisor" },

  # Geometry (Grade 3-9)
  { name: "Rectangle Area", category: "geometry", grade_min: 3, grade_max: 9,
   template_text: "Calculate the area of a rectangle with width {width} and height {height}.",
   variables: [ { name: "width", min: 1, max: 50 }, { name: "height", min: 1, max: 50 } ],
   formula: "width * height" },
  { name: "Rectangle Perimeter", category: "geometry", grade_min: 3, grade_max: 9,
   template_text: "Calculate the perimeter of a rectangle with width {width} and height {height}.",
   variables: [ { name: "width", min: 1, max: 50 }, { name: "height", min: 1, max: 50 } ],
   formula: "2 * (width + height)" },
  { name: "Triangle Area", category: "geometry", grade_min: 3, grade_max: 9,
   template_text: "Calculate the area of a triangle with base {base} and height {height}.",
   variables: [ { name: "base", min: 2, max: 40 }, { name: "height", min: 2, max: 40 } ],
   formula: "base * height / 2" },

  # Percentages (Grade 5-9)
  { name: "Percentage of Number", category: "percentage", grade_min: 5, grade_max: 9,
   template_text: "What is {percent}% of {number}?",
   variables: [ { name: "percent", min: 5, max: 95 }, { name: "number", min: 10, max: 500 } ],
   formula: "percent * number / 100" },

  # Algebra (Grade 6-9)
  { name: "Simple Linear Equation", category: "algebra", grade_min: 6, grade_max: 9,
   template_text: "Solve for x: {a}x + {b} = {c}",
   variables: [ { name: "a", min: 1, max: 10 }, { name: "b", min: 1, max: 20 }, { name: "c", min: 5, max: 50 } ],
   formula: "(c - b) / a" },

  # Volume (Grade 5-9)
  { name: "Rectangular Prism Volume", category: "volume", grade_min: 5, grade_max: 9,
   template_text: "Calculate the volume of a rectangular prism with length {length}, width {width}, and height {height}.",
   variables: [ { name: "length", min: 1, max: 20 }, { name: "width", min: 1, max: 20 }, { name: "height", min: 1, max: 20 } ],
   formula: "length * width * height" }
]

templates.each do |attrs|
  QuestionTemplate.find_or_create_by!(name: attrs[:name]) do |t|
    t.assign_attributes(attrs)
  end
end

puts "Seeded #{QuestionTemplate.count} question templates"
